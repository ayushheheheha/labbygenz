import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  deleteAdminQuestionApi,
  getAdminQuizApi,
  getAdminQuizQuestionsApi,
  reorderAdminQuizQuestionsApi,
  updateAdminQuizApi,
} from '../../api/admin.api'
import Card from '../../components/ui/Card'
import RichText from '../../components/shared/RichText'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import CodeBlock from '../../components/shared/CodeBlock'
import Modal from '../../components/ui/Modal'
import SlideOver from '../../components/ui/SlideOver'
import Input from '../../components/ui/Input'
import QuestionBuilder from '../../components/admin/QuestionBuilder'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { resolveMediaUrl } from '../../utils/media'
import Icon from '../../components/ui/Icon'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

const sectionBadgeMap = {
  practice: 'info',
  quiz1: 'success',
  quiz2: 'warning',
  endterm: 'danger',
}

function stripMarkdown(text = '') {
  return String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[\*#_>\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function SortableQuestionItem({ question, isActive, onSelect, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id })
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-3 ${
        isActive ? 'border-brand bg-brand/10' : 'border-surface-border bg-surface-raised'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onSelect(question)} className="flex flex-1 items-start gap-2 text-left">
          <span {...attributes} {...listeners} className="cursor-grab text-surface-muted" title="Drag to reorder">
            <Icon name="drag" size="sm" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-surface-muted">#{(question.position ?? 0) + 1}</p>
            <p className="line-clamp-2 text-sm font-medium">{stripMarkdown(question.stem).slice(0, 60) || 'Untitled question'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="info" size="sm">{question.type}</Badge>
              <Badge size="sm">{question.difficulty}</Badge>
              <Badge size="sm">{question.marks} marks</Badge>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onEdit(question)} className="rounded-md px-2 py-1 text-brand hover:bg-surface-card">
            <Icon name="edit" size="sm" />
          </button>
          <button type="button" onClick={() => onDelete(question)} className="rounded-md px-2 py-1 text-danger hover:bg-surface-card">
            <Icon name="trash" size="sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminQuizManage() {
  const { id } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [editQuizOpen, setEditQuizOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [savingQuiz, setSavingQuiz] = useState(false)
  const [quizForm, setQuizForm] = useState({ title: '', description: '', time_limit_minutes: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const loadData = async () => {
    try {
      const [{ data: quizData }, { data: questionsData }] = await Promise.all([
        getAdminQuizApi(id),
        getAdminQuizQuestionsApi(id),
      ])
      const resolvedQuiz = quizData?.quiz || quizData
      const resolvedQuestions = Array.isArray(questionsData) ? questionsData : questionsData?.questions || []
      const sorted = [...resolvedQuestions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      setQuiz(resolvedQuiz)
      setQuizForm({
        title: resolvedQuiz?.title || '',
        description: resolvedQuiz?.description || '',
        time_limit_minutes: resolvedQuiz?.time_limit_minutes || '',
      })
      setQuestions(sorted)
      setSelectedQuestion((prev) => {
        if (prev) {
          return sorted.find((item) => item.id === prev.id) || sorted[0] || null
        }
        return sorted[0] || null
      })
    } catch {
      toast.error('Unable to load quiz details')
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const totalMarks = useMemo(() => questions.reduce((sum, item) => sum + Number(item.marks || 0), 0), [questions])

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setQuestions((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      const moved = arrayMove(prev, oldIndex, newIndex).map((item, index) => ({ ...item, position: index }))
      return moved
    })

    try {
      const reorderedIds = questions
        .map((item) => item.id)
      const oldIndex = reorderedIds.findIndex((item) => item === active.id)
      const newIndex = reorderedIds.findIndex((item) => item === over.id)
      const nextOrder = arrayMove(reorderedIds, oldIndex, newIndex)
      await reorderAdminQuizQuestionsApi(id, { question_ids: nextOrder })
      toast.success('Question order updated')
      await loadData()
    } catch {
      toast.error('Unable to reorder questions')
      await loadData()
    }
  }

  const openCreateBuilder = () => {
    setEditingQuestion(null)
    setBuilderOpen(true)
  }

  const openEditBuilder = (question) => {
    setEditingQuestion(question)
    setBuilderOpen(true)
  }

  const onQuestionSaved = async () => {
    await loadData()
  }

  const handleDeleteQuestion = async () => {
    if (!deleteTarget) return
    try {
      await deleteAdminQuestionApi(deleteTarget.id)
      toast.success('Question deleted')
      setDeleteTarget(null)
      await loadData()
    } catch {
      toast.error('Unable to delete question')
    }
  }

  const updateQuizMeta = async () => {
    if (!quiz) return
    setSavingQuiz(true)
    try {
      const { data } = await updateAdminQuizApi(quiz.id, {
        title: quizForm.title,
        description: quizForm.description,
        time_limit_minutes: quizForm.time_limit_minutes ? Number(quizForm.time_limit_minutes) : null,
      })
      setQuiz(data)
      setEditQuizOpen(false)
      toast.success('Quiz updated')
    } catch {
      toast.error('Unable to update quiz')
    } finally {
      setSavingQuiz(false)
    }
  }

  const renderPreview = (question) => {
    if (!question) {
      return <p className="text-sm text-surface-muted">Select a question from the list to preview it.</p>
    }

    const options = question.question_options || question.questionOptions || question.options || []
    const shortAnswers = question.short_answer_acceptables || question.shortAnswerAcceptables || []

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{question.type}</Badge>
          <Badge>{question.difficulty}</Badge>
          <Badge>{question.marks} marks</Badge>
        </div>

        <RichText content={question.stem || ''} />

        {question.stem_image ? (
          <div className="inline-flex max-w-full rounded-lg border border-surface-border bg-surface-raised p-1">
            <img
              src={resolveMediaUrl(question.stem_image)}
              alt="Stem"
              className="block h-auto max-h-[420px] w-auto max-w-full rounded-md object-contain"
            />
          </div>
        ) : null}

        {question.stem_code ? <CodeBlock language={question.stem_code_language || 'plaintext'} code={question.stem_code} /> : null}

        {(question.type === 'mcq' || question.type === 'multi_select' || question.type === 'true_false') ? (
          <div className="space-y-2">
            {options.map((option) => (
              <div
                key={option.id || `${option.option_text}-${option.position}`}
                className={`rounded-lg border px-3 py-2 ${
                  option.is_correct ? 'border-success/40 bg-success/10' : 'border-surface-border bg-surface-raised'
                }`}
              >
                {option.option_type === 'code' ? (
                  <CodeBlock language={option.code_language || 'plaintext'} code={option.option_text || ''} />
                ) : (
                  <p className="text-sm">{option.option_text}</p>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {question.type === 'short_answer' ? (
          <div className="space-y-2">
            {shortAnswers.map((item) => (
              <div key={item.id || item.acceptable_text} className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
                {item.acceptable_text}
              </div>
            ))}
          </div>
        ) : null}

        {question.type === 'numerical' ? (
          <div className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
            Correct: {question.numerical_answer} (±{question.numerical_tolerance})
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{quiz?.title || `Quiz ${id}`}</h2>
            <p className="mt-1 text-sm text-surface-muted">
              {quiz?.course?.name || quiz?.course_name || '-'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={sectionBadgeMap[quiz?.section] || 'default'}>{quiz?.section || '-'}</Badge>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setEditQuizOpen(true)}>Edit Quiz</Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-surface-muted">
          <span>Questions: <b className="text-slate-100">{questions.length}</b></span>
          <span>Total Marks: <b className="text-slate-100">{totalMarks}</b></span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[35%_65%]">
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-surface-muted">Questions in Quiz</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {questions.map((question) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    isActive={selectedQuestion?.id === question.id}
                    onSelect={(item) => {
                      setSelectedQuestion(item)
                      if (window.innerWidth < 1024) setPreviewModalOpen(true)
                    }}
                    onEdit={openEditBuilder}
                    onDelete={(item) => setDeleteTarget(item)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button fullWidth onClick={openCreateBuilder}>Add New Question</Button>
        </Card>

        <Card className="hidden lg:block">
          <h3 className="mb-3 text-sm font-semibold text-surface-muted">Question Preview</h3>
          {renderPreview(selectedQuestion)}
        </Card>
      </div>

      <Modal isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Question Preview" size="lg">
        {renderPreview(selectedQuestion)}
      </Modal>

      <SlideOver isOpen={editQuizOpen} onClose={() => setEditQuizOpen(false)} title="Edit Quiz" width="520px">
        <div className="space-y-4">
          <Input
            label="Title"
            value={quizForm.title}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm text-surface-muted">Description</label>
            <textarea
              value={quizForm.description}
              onChange={(event) => setQuizForm((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-[110px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2"
            />
          </div>
          <Input
            label="Time Limit (minutes)"
            type="number"
            value={quizForm.time_limit_minutes}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, time_limit_minutes: event.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditQuizOpen(false)}>Cancel</Button>
            <Button loading={savingQuiz} onClick={updateQuizMeta}>Save</Button>
          </div>
        </div>
      </SlideOver>

      <QuestionBuilder
        isOpen={builderOpen}
        quizId={Number(id)}
        question={editingQuestion}
        onSave={onQuestionSaved}
        onClose={() => setBuilderOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question?"
      />
    </div>
  )
}
