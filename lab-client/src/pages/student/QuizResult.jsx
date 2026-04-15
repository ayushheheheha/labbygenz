import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAttemptResultApi } from '../../api/attempt.api'
import { getLeaderboardApi } from '../../api/quiz.api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import RichText from '../../components/shared/RichText'
import CodeBlock from '../../components/shared/CodeBlock'
import useAuth from '../../hooks/useAuth'

function getCorrectOptionTexts(answer) {
  return (answer.options || []).filter((option) => option.is_correct).map((option) => option.option_text)
}

function getStudentAnswerText(answer) {
  const selectedIds = Array.isArray(answer.student_selected_option_ids)
    ? answer.student_selected_option_ids.map(Number)
    : []

  if (answer.question_type === 'mcq' || answer.question_type === 'true_false' || answer.question_type === 'multi_select') {
    if (!selectedIds.length) return 'Not answered'
    const selectedOptions = (answer.options || [])
      .filter((option) => selectedIds.includes(option.id))
      .map((option) => option.option_text)
    return selectedOptions.length ? selectedOptions.join(', ') : 'Not answered'
  }

  if (answer.question_type === 'short_answer') {
    return answer.student_text_answer || 'Not answered'
  }

  if (answer.question_type === 'numerical') {
    return answer.student_numerical_answer ?? 'Not answered'
  }

  return 'Not answered'
}

export default function QuizResult() {
  const { attemptId, id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [{ data: resultData }, { data: leaderboardData }] = await Promise.all([
          getAttemptResultApi(attemptId),
          getLeaderboardApi(id),
        ])

        setResult(resultData)
        setLeaderboard(Array.isArray(leaderboardData?.top) ? leaderboardData.top : [])
        setMyRank(leaderboardData?.me || null)
      } catch {
        toast.error('Unable to fetch result')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [attemptId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="180px" rounded="1rem" />
        <Skeleton height="320px" rounded="1rem" />
      </div>
    )
  }

  const attempt = result?.attempt
  const quiz = result?.quiz
  const answers = Array.isArray(result?.answers) ? result.answers : []
  const score = Number(attempt?.score || 0)
  const totalMarks = Number(attempt?.total_marks || 0)
  const percentage = Number(attempt?.percentage || 0)
  const roundedPercentage = Math.max(0, Math.min(100, Math.round(percentage)))

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Quiz Submitted</h1>
            <p className="mt-1 text-sm text-surface-muted">{quiz?.title || 'Quiz'} • {quiz?.course_name || 'Course'}</p>
          </div>
          <Badge variant={percentage >= 60 ? 'success' : 'warning'}>{percentage.toFixed(2)}%</Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs text-surface-muted">Score</p>
            <p className="mt-1 text-2xl font-bold">{score.toFixed(2)} / {totalMarks.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs text-surface-muted">Attempt ID</p>
            <p className="mt-1 font-semibold">#{attemptId}</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs text-surface-muted">Submitted</p>
            <p className="mt-1 font-semibold">{attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Just now'}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${roundedPercentage}%` }} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/quiz/${id}`)}>Retry Quiz</Button>
          <Link to="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          {myRank?.rank ? <Badge variant="info">Your Rank: #{myRank.rank}</Badge> : null}
        </div>

        {!leaderboard.length ? (
          <p className="text-sm text-surface-muted">No leaderboard data yet for this quiz.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((item) => {
              const isCurrentUser = user?.id && Number(item.user_id) === Number(user.id)
              return (
                <div
                  key={`leaderboard-${item.rank}-${item.user_id}`}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isCurrentUser ? 'border-brand/60 bg-brand/10' : 'border-surface-border bg-surface-raised'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-card text-xs font-semibold">
                      {item.rank}
                    </span>
                    <span className="text-sm font-medium text-slate-100">{item.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-slate-100">{Number(item.percentage || 0).toFixed(2)}%</p>
                    <p className="text-xs text-surface-muted">{Number(item.score || 0).toFixed(2)} / {Number(item.total_marks || 0).toFixed(2)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Detailed Breakdown</h2>

        <div className="mt-4 space-y-4">
          {answers.map((answer, index) => {
            const correctOptionTexts = getCorrectOptionTexts(answer)
            return (
              <div
                key={answer.question_id}
                className={`rounded-xl border p-4 ${
                  answer.is_correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">Q{index + 1}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={answer.is_correct ? 'success' : 'danger'}>
                      {answer.is_correct ? 'Correct' : 'Incorrect'}
                    </Badge>
                    <Badge>{Number(answer.marks_awarded || 0)} / {Number(answer.marks || 0)}</Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-3 text-sm">
                  <RichText content={answer.question_stem || ''} />
                  {answer.stem_code ? (
                    <CodeBlock
                      language={answer.stem_code_language || 'plaintext'}
                      code={answer.stem_code}
                    />
                  ) : null}

                  <div className="rounded-lg border border-surface-border/70 bg-surface-raised/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-surface-muted">Your answer</p>
                    <p className="mt-1 text-slate-100">{String(getStudentAnswerText(answer))}</p>
                  </div>

                  <div className="rounded-lg border border-surface-border/70 bg-surface-raised/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-surface-muted">Correct answer</p>
                    <p className="mt-1 text-slate-100">
                      {answer.question_type === 'short_answer'
                        ? (answer.correct_short_answers || []).join(', ') || 'N/A'
                        : answer.question_type === 'numerical'
                          ? answer.correct_numerical ?? 'N/A'
                          : correctOptionTexts.join(', ') || 'N/A'}
                    </p>
                  </div>

                  {answer.explanation ? (
                    <div className="rounded-lg border border-surface-border/70 bg-surface-raised/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-surface-muted">Explanation</p>
                      <p className="mt-1 text-slate-100">{answer.explanation}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
