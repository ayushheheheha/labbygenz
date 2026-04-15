import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getQuizApi } from '../../api/quiz.api'
import { startAttemptApi, submitAttemptApi } from '../../api/attempt.api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import RichText from '../../components/shared/RichText'
import CodeBlock from '../../components/shared/CodeBlock'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const mins = String(Math.floor(safe / 60)).padStart(2, '0')
  const secs = String(safe % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

function normalizeSelected(value) {
  return Array.isArray(value) ? value.map(Number) : []
}

export default function QuizAttempt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [attemptId, setAttemptId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [visited, setVisited] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [startLoading, setStartLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const autoSubmitting = useRef(false)

  useEffect(() => {
    const load = async () => {
      setFetching(true)
      try {
        const { data } = await getQuizApi(id)
        const resolvedQuiz = data?.quiz || data
        setQuiz(resolvedQuiz)
        const limitMinutes = Number(resolvedQuiz?.time_limit_minutes || 0)
        setTimeLeft(limitMinutes > 0 ? limitMinutes * 60 : 0)
      } catch {
        toast.error('Unable to load quiz')
      } finally {
        setFetching(false)
      }
    }

    load()
  }, [id])

  const questions = useMemo(() => (Array.isArray(quiz?.questions) ? quiz.questions : []), [quiz])
  const currentQuestion = questions[currentIndex] || null

  const answeredCount = useMemo(() => {
    return questions.reduce((total, question) => {
      const answer = answers[question.id]
      if (!answer) return total

      if (question.type === 'multi_select') {
        return total + (normalizeSelected(answer.selected_option_ids).length ? 1 : 0)
      }

      if (question.type === 'mcq' || question.type === 'true_false') {
        return total + (answer.selected_option_ids && answer.selected_option_ids.length ? 1 : 0)
      }

      if (question.type === 'short_answer') {
        return total + (answer.text_answer?.trim() ? 1 : 0)
      }

      if (question.type === 'numerical') {
        return total + (answer.numerical_answer !== '' && answer.numerical_answer !== null && answer.numerical_answer !== undefined ? 1 : 0)
      }

      return total
    }, 0)
  }, [answers, questions])

  useEffect(() => {
    if (!attemptId || !timeLeft) return undefined
    if (submitLoading) return undefined

    const tick = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tick)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [attemptId, submitLoading, timeLeft])

  useEffect(() => {
    if (!attemptId || timeLeft > 0 || submitLoading || autoSubmitting.current) return
    autoSubmitting.current = true
    toast('Time is up. Submitting your quiz...')
    void onSubmit(true)
  }, [attemptId, submitLoading, timeLeft])

  const markVisited = (index) => {
    setVisited((prev) => (prev.includes(index) ? prev : [...prev, index]))
  }

  const onNavigateTo = (index) => {
    setCurrentIndex(index)
    markVisited(index)
  }

  const setSingleChoice = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option_ids: [optionId],
        text_answer: null,
        numerical_answer: null,
      },
    }))
  }

  const toggleMultiSelect = (questionId, optionId) => {
    setAnswers((prev) => {
      const existing = prev[questionId]
      const selected = normalizeSelected(existing?.selected_option_ids)
      const isSelected = selected.includes(optionId)
      const updated = isSelected ? selected.filter((idValue) => idValue !== optionId) : [...selected, optionId]

      return {
        ...prev,
        [questionId]: {
          question_id: questionId,
          selected_option_ids: updated,
          text_answer: null,
          numerical_answer: null,
        },
      }
    })
  }

  const setShortAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option_ids: null,
        text_answer: value,
        numerical_answer: null,
      },
    }))
  }

  const setNumericalAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option_ids: null,
        text_answer: null,
        numerical_answer: value,
      },
    }))
  }

  const onStart = async () => {
    setStartLoading(true)
    try {
      const { data } = await startAttemptApi(id)
      const nextAttemptId = data?.attempt_id || data?.attempt?.id || data?.id
      setAttemptId(nextAttemptId)
      setVisited([0])
      setCurrentIndex(0)
      toast.success('Attempt started')
    } catch {
      toast.error('Could not start attempt')
    } finally {
      setStartLoading(false)
    }
  }

  const onSubmit = async (auto = false) => {
    if (!attemptId) return
    setSubmitLoading(true)
    setConfirmOpen(false)
    try {
      const payload = {
        answers: Object.values(answers),
      }

      const { data } = await submitAttemptApi(attemptId, payload)
      const nextAttemptId = data?.attempt_id || attemptId
      if (auto) {
        toast.success('Quiz auto-submitted')
      } else {
        toast.success('Quiz submitted successfully')
      }
      navigate(`/quiz/${id}/result/${nextAttemptId}`)
    } catch {
      autoSubmitting.current = false
      toast.error('Unable to submit quiz')
    } finally {
      setSubmitLoading(false)
    }
  }

  const renderOptionCard = (question, option) => {
    const answer = answers[question.id]
    const selectedIds = normalizeSelected(answer?.selected_option_ids)
    const isSelected = selectedIds.includes(option.id)
    const isMulti = question.type === 'multi_select'

    return (
      <button
        key={option.id}
        type="button"
        onClick={() => (isMulti ? toggleMultiSelect(question.id, option.id) : setSingleChoice(question.id, option.id))}
        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
          isSelected
            ? 'border-brand bg-brand/15 shadow-glow'
            : 'border-surface-border bg-surface-raised hover:border-brand/50'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xs text-surface-muted">{isMulti ? '☑' : '◉'}</span>
          <div className="w-full">
            {option.option_type === 'code' ? (
              <CodeBlock language={option.code_language || 'plaintext'} code={option.option_text || ''} />
            ) : (
              <p className="text-sm text-slate-100">{option.option_text}</p>
            )}
          </div>
        </div>
      </button>
    )
  }

  const getNavState = (question, index) => {
    const answer = answers[question.id]
    const isVisited = visited.includes(index)
    let isAnswered = false

    if (answer) {
      if (question.type === 'multi_select') isAnswered = normalizeSelected(answer.selected_option_ids).length > 0
      if (question.type === 'mcq' || question.type === 'true_false') isAnswered = normalizeSelected(answer.selected_option_ids).length > 0
      if (question.type === 'short_answer') isAnswered = !!answer.text_answer?.trim()
      if (question.type === 'numerical') isAnswered = answer.numerical_answer !== '' && answer.numerical_answer !== null && answer.numerical_answer !== undefined
    }

    if (!isVisited) return 'not-visited'
    if (isAnswered) return 'answered'
    return 'visited-unanswered'
  }

  const navClassMap = {
    'not-visited': 'border-surface-border bg-surface-raised text-slate-300',
    answered: 'border-success/50 bg-success/20 text-success',
    'visited-unanswered': 'border-warning/50 bg-warning/20 text-warning',
  }

  if (fetching) {
    return (
      <div className="space-y-4">
        <Card><div className="h-10 w-full animate-pulse rounded-lg bg-surface-raised" /></Card>
        <Card><div className="h-96 w-full animate-pulse rounded-lg bg-surface-raised" /></Card>
      </div>
    )
  }

  if (!quiz) {
    return <EmptyState icon="📝" title="Quiz unavailable" description="This quiz is not available right now." />
  }

  if (!questions.length) {
    return <EmptyState icon="🧩" title="No questions found" description="This quiz currently has no questions." />
  }

  if (!attemptId) {
    return (
      <Card className="rounded-2xl p-6">
        <h2 className="text-2xl font-semibold">{quiz.title || `Quiz ${id}`}</h2>
        <p className="mt-2 text-sm text-surface-muted">{quiz.description || 'Solve all questions within the time limit.'}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs text-surface-muted">Questions</p>
            <p className="mt-1 text-xl font-semibold">{questions.length}</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs text-surface-muted">Total Marks</p>
            <p className="mt-1 text-xl font-semibold">
              {questions.reduce((sum, q) => sum + Number(q.marks || 0), 0)}
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs text-surface-muted">Time Limit</p>
            <p className="mt-1 text-xl font-semibold">{quiz.time_limit_minutes || 0} min</p>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={onStart} loading={startLoading}>
            Start Attempt
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      <Card className="sticky top-20 z-20 border-brand/20 bg-[#0f1520]/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{quiz.title || `Quiz ${id}`}</h2>
            <p className="text-xs text-surface-muted">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Answered {answeredCount}/{questions.length}</Badge>
            <Badge variant={timeLeft < 60 ? 'danger' : 'warning'}>{formatTime(timeLeft)}</Badge>
            <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={submitLoading}>
              Submit Quiz
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Question {currentIndex + 1}</h3>
            <Badge>{currentQuestion.type}</Badge>
          </div>

          <div className="space-y-3">
            <RichText content={currentQuestion.stem || ''} />
            {currentQuestion.stem_code ? (
              <CodeBlock
                language={currentQuestion.stem_code_language || 'plaintext'}
                code={currentQuestion.stem_code}
              />
            ) : null}
            {currentQuestion.stem_image ? (
              <img
                src={currentQuestion.stem_image}
                alt="Question stem"
                className="max-h-72 w-full rounded-lg border border-surface-border object-contain"
              />
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {(currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false' || currentQuestion.type === 'multi_select') &&
              currentQuestion.options?.map((option) => renderOptionCard(currentQuestion, option))}

            {currentQuestion.type === 'short_answer' && (
              <textarea
                value={answers[currentQuestion.id]?.text_answer || ''}
                onChange={(event) => setShortAnswer(currentQuestion.id, event.target.value)}
                className="min-h-[140px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/30"
                placeholder="Write your answer here..."
              />
            )}

            {currentQuestion.type === 'numerical' && (
              <Input
                type="number"
                placeholder="Enter numerical answer"
                value={answers[currentQuestion.id]?.numerical_answer ?? ''}
                onChange={(event) => setNumericalAnswer(currentQuestion.id, event.target.value)}
              />
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-4">
            <Button
              variant="secondary"
              onClick={() => onNavigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => onNavigateTo(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              Next
            </Button>
          </div>
        </Card>

        <Card className="h-fit lg:sticky lg:top-40">
          <h3 className="mb-3 text-sm font-semibold text-surface-muted">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const status = getNavState(question, index)
              const isCurrent = currentIndex === index
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onNavigateTo(index)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${navClassMap[status]} ${
                    isCurrent ? 'ring-2 ring-brand' : ''
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-4 space-y-1 text-xs text-surface-muted">
            <p>Not Visited: gray</p>
            <p>Visited Unanswered: yellow</p>
            <p>Answered: green</p>
          </div>
        </Card>
      </div>

      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm" style={{ display: submitLoading ? 'block' : 'none' }}>
        <div className="flex h-full items-center justify-center">
          <Card className="w-[280px] text-center">
            <p className="text-sm text-surface-muted">Submitting your quiz...</p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => onSubmit(false)}
        title="Submit Quiz"
        message="Are you sure you want to submit? You cannot change answers after submission."
      />
    </div>
  )
}
