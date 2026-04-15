import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import SlideOver from '../ui/SlideOver'
import Button from '../ui/Button'
import Input from '../ui/Input'
import RichText from '../shared/RichText'
import CodeBlock from '../shared/CodeBlock'
import {
  createAdminQuizQuestionApi,
  updateAdminQuestionFormApi,
} from '../../api/admin.api'
import { resolveMediaUrl } from '../../utils/media'

const TYPE_CARDS = [
  { value: 'mcq', label: 'Multiple Choice', icon: '📝' },
  { value: 'multi_select', label: 'Multi-Select', icon: '☑️' },
  { value: 'true_false', label: 'True / False', icon: '✅' },
  { value: 'short_answer', label: 'Short Answer', icon: '💬' },
  { value: 'numerical', label: 'Numerical', icon: '🔢' },
]

const CODE_LANGS = ['pseudocode', 'python', 'java', 'cpp', 'general']

function createEmptyOption(position = 0) {
  return {
    option_type: 'text',
    option_text: '',
    code_language: 'pseudocode',
    is_correct: false,
    position,
  }
}

function normalizeQuestion(question) {
  if (!question) {
    return {
      type: 'mcq',
      stem: '',
      stem_image: null,
      stem_code: '',
      stem_code_language: 'pseudocode',
      explanation: '',
      marks: 1,
      difficulty: 'medium',
      numerical_answer: '',
      numerical_tolerance: 0.01,
      options: [createEmptyOption(0), createEmptyOption(1)],
      acceptable_answers: [''],
    }
  }

  const options = Array.isArray(question.question_options || question.questionOptions)
    ? (question.question_options || question.questionOptions).map((option, index) => ({
      option_type: option.option_type || 'text',
      option_text: option.option_text || '',
      code_language: option.code_language || 'pseudocode',
      is_correct: !!option.is_correct,
      position: option.position ?? index,
    }))
    : []

  const acceptable = Array.isArray(question.short_answer_acceptables || question.shortAnswerAcceptables)
    ? (question.short_answer_acceptables || question.shortAnswerAcceptables).map((item) => item.acceptable_text || '')
    : []

  return {
    type: question.type || 'mcq',
    stem: question.stem || '',
    stem_image: question.stem_image || null,
    stem_code: question.stem_code || '',
    stem_code_language: question.stem_code_language || 'pseudocode',
    explanation: question.explanation || '',
    marks: Number(question.marks || 1),
    difficulty: question.difficulty || 'medium',
    numerical_answer: question.numerical_answer ?? '',
    numerical_tolerance: question.numerical_tolerance ?? 0.01,
    options: options.length ? options : [createEmptyOption(0), createEmptyOption(1)],
    acceptable_answers: acceptable.length ? acceptable : [''],
  }
}

export default function QuestionBuilder({
  isOpen,
  quizId,
  question = null,
  onSave,
  onClose,
}) {
  const isEdit = !!question
  const [form, setForm] = useState(normalizeQuestion(question))
  const [showStemPreview, setShowStemPreview] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const next = normalizeQuestion(question)
    setForm(next)
    setShowImage(!!next.stem_image)
    setShowCode(!!next.stem_code)
    setShowStemPreview(false)
    setImageFile(null)
    setImagePreview(next.stem_image ? resolveMediaUrl(next.stem_image) : '')
    setRemoveExistingImage(false)
  }, [question, isOpen])

  const sectionTitle = isEdit ? 'Edit Question' : 'Add Question'

  const normalizedOptions = useMemo(() => {
    if (form.type === 'true_false') {
      const trueCorrect = form.options.find((opt) => String(opt.option_text).toLowerCase() === 'true')?.is_correct
      return [
        { option_type: 'text', option_text: 'True', code_language: null, is_correct: !!trueCorrect, position: 0 },
        { option_type: 'text', option_text: 'False', code_language: null, is_correct: !trueCorrect, position: 1 },
      ]
    }

    return form.options.map((opt, index) => ({ ...opt, position: index }))
  }, [form.options, form.type])

  const setType = (type) => {
    setForm((prev) => {
      const reset = {
        ...prev,
        type,
        numerical_answer: '',
        numerical_tolerance: 0.01,
        acceptable_answers: [''],
        options: [createEmptyOption(0), createEmptyOption(1)],
      }

      if (type === 'true_false') {
        reset.options = [
          { option_type: 'text', option_text: 'True', code_language: null, is_correct: true, position: 0 },
          { option_type: 'text', option_text: 'False', code_language: null, is_correct: false, position: 1 },
        ]
      }

      return reset
    })
  }

  const updateOption = (index, patch) => {
    setForm((prev) => {
      const nextOptions = [...prev.options]
      nextOptions[index] = { ...nextOptions[index], ...patch }
      return { ...prev, options: nextOptions }
    })
  }

  const setOptionCorrect = (index, checked = true) => {
    setForm((prev) => {
      let next = [...prev.options]
      if (prev.type === 'mcq' || prev.type === 'true_false') {
        next = next.map((option, idx) => ({ ...option, is_correct: idx === index }))
      } else {
        next[index] = { ...next[index], is_correct: checked }
      }
      return { ...prev, options: next }
    })
  }

  const addOption = () => {
    setForm((prev) => {
      if (prev.options.length >= 6) return prev
      return { ...prev, options: [...prev.options, createEmptyOption(prev.options.length)] }
    })
  }

  const removeOption = (index) => {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev
      return { ...prev, options: prev.options.filter((_, idx) => idx !== index) }
    })
  }

  const updateAcceptableAnswer = (index, value) => {
    setForm((prev) => {
      const next = [...prev.acceptable_answers]
      next[index] = value
      return { ...prev, acceptable_answers: next }
    })
  }

  const addAcceptableAnswer = () => {
    setForm((prev) => ({ ...prev, acceptable_answers: [...prev.acceptable_answers, ''] }))
  }

  const removeAcceptableAnswer = (index) => {
    setForm((prev) => {
      if (prev.acceptable_answers.length <= 1) return prev
      return { ...prev, acceptable_answers: prev.acceptable_answers.filter((_, idx) => idx !== index) }
    })
  }

  const onImagePicked = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setImageFile(file)
    setRemoveExistingImage(false)
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
  }

  const buildPayload = () => {
    const payload = new FormData()

    payload.append('type', form.type)
    payload.append('stem', form.stem)
    payload.append('stem_code', showCode ? form.stem_code : '')
    payload.append('stem_code_language', showCode ? form.stem_code_language : 'pseudocode')
    payload.append('explanation', form.explanation || '')
    payload.append('marks', String(form.marks || 1))
    payload.append('difficulty', form.difficulty || 'medium')

    if (form.type === 'numerical') {
      payload.append('numerical_answer', String(form.numerical_answer))
      payload.append('numerical_tolerance', String(form.numerical_tolerance || 0))
    }

    if (form.type === 'short_answer') {
      payload.append(
        'acceptable_answers_json',
        JSON.stringify(form.acceptable_answers.map((item) => item.trim()).filter(Boolean)),
      )
    }

    if (form.type === 'mcq' || form.type === 'multi_select' || form.type === 'true_false') {
      payload.append('options_json', JSON.stringify(normalizedOptions))
    }

    if (imageFile) {
      payload.append('stem_image', imageFile)
    }

    if (isEdit && removeExistingImage) {
      payload.append('remove_stem_image', '1')
    }

    return payload
  }

  const validateBeforeSave = () => {
    if (!form.stem.trim()) {
      toast.error('Question stem is required')
      return false
    }

    if (form.type === 'mcq' || form.type === 'true_false') {
      const correctCount = normalizedOptions.filter((opt) => opt.is_correct).length
      if (correctCount !== 1) {
        toast.error('Select exactly one correct option')
        return false
      }
    }

    if (form.type === 'multi_select') {
      const correctCount = normalizedOptions.filter((opt) => opt.is_correct).length
      if (correctCount < 1) {
        toast.error('Select at least one correct option')
        return false
      }
    }

    if (form.type === 'mcq' || form.type === 'multi_select') {
      if (normalizedOptions.some((opt) => !String(opt.option_text).trim())) {
        toast.error('All options must have text/code content')
        return false
      }
    }

    if (form.type === 'short_answer') {
      if (!form.acceptable_answers.some((ans) => ans.trim())) {
        toast.error('Add at least one accepted short answer')
        return false
      }
    }

    if (form.type === 'numerical' && (form.numerical_answer === '' || form.numerical_answer === null)) {
      toast.error('Numerical correct value is required')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateBeforeSave()) return

    setSaving(true)
    try {
      const payload = buildPayload()
      let response
      if (isEdit) {
        payload.append('_method', 'PUT')
        response = await updateAdminQuestionFormApi(question.id, payload)
      } else {
        response = await createAdminQuizQuestionApi(quizId, payload)
      }

      onSave?.(response.data)
      toast.success(isEdit ? 'Question updated successfully' : 'Question created successfully')
      onClose?.()
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to save question'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={sectionTitle}
      width="70vw"
    >
      <div className="space-y-6 pb-16">
        <section>
          <h4 className="mb-3 text-sm font-semibold text-surface-muted">Question Type</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {TYPE_CARDS.map((typeCard) => (
              <button
                key={typeCard.value}
                type="button"
                onClick={() => setType(typeCard.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  form.type === typeCard.value
                    ? 'border-brand bg-brand/10'
                    : 'border-surface-border bg-surface-raised hover:border-brand/60'
                }`}
              >
                <p className="text-lg">{typeCard.icon}</p>
                <p className="mt-1 text-sm font-semibold">{typeCard.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-surface-muted">Question Stem</h4>
            <button
              type="button"
              onClick={() => setShowStemPreview((prev) => !prev)}
              className="text-xs text-brand hover:text-brand-light"
            >
              {showStemPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
          <textarea
            value={form.stem}
            onChange={(event) => setForm((prev) => ({ ...prev, stem: event.target.value }))}
            className="min-h-[120px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            placeholder="Enter question stem..."
          />
          <p className="mt-2 text-xs text-surface-muted">Use $...$ for inline math, $$...$$ for block math.</p>
          {showStemPreview ? (
            <div className="mt-3 rounded-xl border border-surface-border bg-surface-raised p-3">
              <RichText content={form.stem} />
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showImage}
                onChange={(event) => setShowImage(event.target.checked)}
              />
              Add Image to Question
            </label>

            {showImage ? (
              <div className="mt-3">
                <label
                  htmlFor="stem-image-input"
                  className="flex min-h-[100px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface-raised px-3 py-4 text-center text-sm text-surface-muted"
                >
                  Drag-drop or click to browse image
                </label>
                <input
                  id="stem-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onImagePicked(event.target.files?.[0])}
                />

                {imagePreview ? (
                  <div className="relative mt-3">
                    <img src={imagePreview} alt="Question" className="max-h-48 w-full rounded-lg border border-surface-border object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                        if (isEdit) setRemoveExistingImage(true)
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs"
                    >
                      x
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-surface-border p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showCode}
                onChange={(event) => setShowCode(event.target.checked)}
              />
              Add Code Block to Question
            </label>

            {showCode ? (
              <div className="mt-3 space-y-3">
                <select
                  value={form.stem_code_language}
                  onChange={(event) => setForm((prev) => ({ ...prev, stem_code_language: event.target.value }))}
                  className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
                >
                  {CODE_LANGS.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <textarea
                  value={form.stem_code}
                  onChange={(event) => setForm((prev) => ({ ...prev, stem_code: event.target.value }))}
                  className="min-h-[150px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 font-mono text-sm"
                  placeholder="Paste code or pseudocode"
                />

                {form.stem_code ? <CodeBlock language={form.stem_code_language} code={form.stem_code} /> : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-surface-border p-4">
          <h4 className="mb-3 text-sm font-semibold text-surface-muted">Answer Section</h4>

          {(form.type === 'mcq' || form.type === 'multi_select' || form.type === 'true_false') ? (
            <div className="space-y-3">
              {normalizedOptions.map((option, index) => {
                const lockOption = form.type === 'true_false'
                return (
                  <div key={`option-${index}`} className="rounded-xl border border-surface-border bg-surface-raised p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-surface-muted">
                        <input
                          type={form.type === 'multi_select' ? 'checkbox' : 'radio'}
                          checked={!!option.is_correct}
                          name={form.type === 'multi_select' ? `correct-${index}` : 'correct-option'}
                          onChange={(event) => setOptionCorrect(index, event.target.checked)}
                        />
                        Correct
                      </label>
                      {!lockOption ? (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          disabled={normalizedOptions.length <= 2}
                          className="text-xs text-danger disabled:opacity-40"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>

                    {!lockOption ? (
                      <div className="mb-2 inline-flex rounded-lg border border-surface-border bg-[#0d1117] p-1 text-xs">
                        <button
                          type="button"
                          className={`rounded-md px-2 py-1 ${option.option_type === 'text' ? 'bg-brand text-white' : 'text-surface-muted'}`}
                          onClick={() => updateOption(index, { option_type: 'text' })}
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          className={`rounded-md px-2 py-1 ${option.option_type === 'code' ? 'bg-brand text-white' : 'text-surface-muted'}`}
                          onClick={() => updateOption(index, { option_type: 'code' })}
                        >
                          Code
                        </button>
                      </div>
                    ) : null}

                    {option.option_type === 'code' ? (
                      <div className="space-y-2">
                        <select
                          value={option.code_language || 'pseudocode'}
                          disabled={lockOption}
                          onChange={(event) => updateOption(index, { code_language: event.target.value })}
                          className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
                        >
                          {['pseudocode', 'python', 'java', 'cpp'].map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                        <textarea
                          value={option.option_text}
                          disabled={lockOption}
                          onChange={(event) => updateOption(index, { option_text: event.target.value })}
                          className="min-h-[90px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 font-mono text-sm"
                        />
                      </div>
                    ) : (
                      <input
                        value={option.option_text}
                        disabled={lockOption}
                        onChange={(event) => updateOption(index, { option_text: event.target.value })}
                        className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                )
              })}

              {form.type !== 'true_false' ? (
                <Button variant="secondary" onClick={addOption} disabled={normalizedOptions.length >= 6}>
                  + Add Option
                </Button>
              ) : null}
            </div>
          ) : null}

          {form.type === 'short_answer' ? (
            <div className="space-y-2">
              <p className="text-xs text-surface-muted">Case-insensitive matching. Add all valid variations.</p>
              {form.acceptable_answers.map((answer, index) => (
                <div key={`ans-${index}`} className="flex items-center gap-2">
                  <input
                    value={answer}
                    onChange={(event) => updateAcceptableAnswer(index, event.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
                    placeholder={`Accepted answer ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeAcceptableAnswer(index)}
                    className="text-xs text-danger"
                    disabled={form.acceptable_answers.length <= 1}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addAcceptableAnswer}>+ Add Answer</Button>
            </div>
          ) : null}

          {form.type === 'numerical' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Correct Value"
                type="number"
                value={form.numerical_answer}
                onChange={(event) => setForm((prev) => ({ ...prev, numerical_answer: event.target.value }))}
              />
              <Input
                label="Tolerance +/-"
                type="number"
                value={form.numerical_tolerance}
                onChange={(event) => setForm((prev) => ({ ...prev, numerical_tolerance: event.target.value }))}
              />
              <p className="sm:col-span-2 text-xs text-surface-muted">Student answer is accepted if within +/- tolerance of the correct value.</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-surface-border p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs text-surface-muted">Difficulty</p>
              <div className="inline-flex rounded-lg border border-surface-border bg-[#0d1117] p-1 text-xs">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`rounded-md px-3 py-1 ${form.difficulty === level ? 'bg-brand text-white' : 'text-surface-muted'}`}
                    onClick={() => setForm((prev) => ({ ...prev, difficulty: level }))}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Marks"
              type="number"
              value={form.marks}
              onChange={(event) => setForm((prev) => ({ ...prev, marks: event.target.value }))}
            />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm text-surface-muted">Explanation</label>
            <textarea
              value={form.explanation}
              onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))}
              className="min-h-[100px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
              placeholder="Explanation shown to students after submitting"
            />
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex items-center justify-end gap-2 border-t border-surface-border bg-surface-card px-5 py-4">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Save Question</Button>
      </div>
    </SlideOver>
  )
}
