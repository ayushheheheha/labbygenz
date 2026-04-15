import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getCourseBySlugApi, getCourseWeeksApi, getExamPrepApi, getWeekQuizzesApi } from '../../api/course.api'
import { getIdeByCourseApi } from '../../api/ide.api'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [activeTab, setActiveTab] = useState('practice')
  const [openWeekNumber, setOpenWeekNumber] = useState(null)
  const [weekQuizCache, setWeekQuizCache] = useState({})
  const [weekLoading, setWeekLoading] = useState({})
  const [examPrep, setExamPrep] = useState({ quiz1: [], quiz2: [], endterm: [] })
  const [examLoading, setExamLoading] = useState(false)
  const [examLoaded, setExamLoaded] = useState(false)
  const [ideWeeks, setIdeWeeks] = useState([])
  const [ideLoading, setIdeLoading] = useState(false)
  const [ideLoaded, setIdeLoaded] = useState(false)

  useEffect(() => {
    setExamLoaded(false)
    setExamPrep({ quiz1: [], quiz2: [], endterm: [] })

    const load = async () => {
      try {
        const [{ data: courseData }, { data: weeksData }] = await Promise.all([
          getCourseBySlugApi(slug),
          getCourseWeeksApi(slug),
        ])
        setCourse(courseData?.course || courseData)
        setWeeks(Array.isArray(weeksData) ? weeksData : weeksData?.weeks || [])
      } catch {
        toast.error('Unable to load course details')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  useEffect(() => {
    if (activeTab !== 'exam') return
    if (examLoaded) return

    const loadExamPrep = async () => {
      setExamLoading(true)
      try {
        const { data } = await getExamPrepApi(slug)
        setExamPrep({
          quiz1: Array.isArray(data?.quiz1) ? data.quiz1 : [],
          quiz2: Array.isArray(data?.quiz2) ? data.quiz2 : [],
          endterm: Array.isArray(data?.endterm) ? data.endterm : [],
        })
      } catch {
        toast.error('Unable to load exam prep quizzes')
      } finally {
        setExamLoading(false)
        setExamLoaded(true)
      }
    }

    loadExamPrep()
  }, [activeTab, examLoaded, slug])

  useEffect(() => {
    if (activeTab !== 'ide') return
    if (ideLoaded) return

    const loadIde = async () => {
      setIdeLoading(true)
      try {
        const { data } = await getIdeByCourseApi(slug)
        setIdeWeeks(Array.isArray(data?.weeks) ? data.weeks : [])
      } catch {
        toast.error('Unable to load IDE practice problems')
      } finally {
        setIdeLoading(false)
        setIdeLoaded(true)
      }
    }

    loadIde()
  }, [activeTab, ideLoaded, slug])

  const onToggleWeek = async (weekNumber) => {
    setOpenWeekNumber((prev) => (prev === weekNumber ? null : weekNumber))
    if (weekQuizCache[weekNumber]) return

    setWeekLoading((prev) => ({ ...prev, [weekNumber]: true }))
    try {
      const { data } = await getWeekQuizzesApi(slug, weekNumber)
      setWeekQuizCache((prev) => ({
        ...prev,
        [weekNumber]: Array.isArray(data) ? data : [],
      }))
    } catch {
      toast.error(`Unable to load Week ${weekNumber} quizzes`)
    } finally {
      setWeekLoading((prev) => ({ ...prev, [weekNumber]: false }))
    }
  }

  const onOpenIdeList = () => {
    navigate(`/courses/${slug}/ide-problems`)
  }

  const hasAnyExamPrep = useMemo(() => {
    return examPrep.quiz1.length || examPrep.quiz2.length || examPrep.endterm.length
  }, [examPrep])

  const renderQuizRow = (quiz) => (
    <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
      <div>
        <p className="font-semibold text-slate-100">{quiz.title}</p>
        <p className="mt-1 text-sm text-surface-muted">{quiz.description || 'Timed quiz'}</p>
        {quiz.user_has_attempted ? (
          <p className="mt-1 text-xs text-success">Attempted {quiz.attempt_count > 1 ? `(${quiz.attempt_count} times)` : ''}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge>{quiz.question_count || 0} Q</Badge>
        <Badge variant="warning">{quiz.time_limit_minutes || 0} min</Badge>
        {quiz.user_has_attempted ? <Badge variant="success">Done</Badge> : null}
        <Link to={`/quiz/${quiz.id}`}>
          <Button size="sm">{quiz.user_has_attempted ? 'Retry Quiz' : 'Start Quiz'}</Button>
        </Link>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="160px" rounded="1rem" />
        <Skeleton height="56px" rounded="0.75rem" />
        <Skeleton height="360px" rounded="1rem" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[2.2rem] leading-none">{course?.icon || '📘'}</p>
            <h1 className="mt-3 text-2xl font-semibold">{course?.name || slug}</h1>
            <p className="mt-2 max-w-3xl text-sm text-surface-muted">
              {course?.description || 'Course outline and weekly practice.'}
            </p>
          </div>
          {(course?.has_ide || course?.has_ide_problems) && (
            <Button variant="secondary" onClick={onOpenIdeList}>
              IDE Practice
            </Button>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'practice' ? 'bg-brand text-white' : 'text-surface-muted hover:bg-surface-raised'
          }`}
        >
          Practice Weekwise
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exam')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'exam' ? 'bg-brand text-white' : 'text-surface-muted hover:bg-surface-raised'
          }`}
        >
          Exam Prep
        </button>
        {(course?.has_ide || course?.has_ide_problems) ? (
          <button
            type="button"
            onClick={() => setActiveTab('ide')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'ide' ? 'bg-brand text-white' : 'text-surface-muted hover:bg-surface-raised'
            }`}
          >
            IDE Practice
          </button>
        ) : null}
      </div>

      {activeTab === 'practice' && (
        <div className="space-y-3">
          {weeks.map((week) => {
            const isOpen = openWeekNumber === week.week_number
            const items = weekQuizCache[week.week_number] || []
            const isWeekLoading = !!weekLoading[week.week_number]
            const totalInWeek = items.length
            const attemptedInWeek = items.filter((quiz) => quiz.user_has_attempted).length
            const weekCompleted = totalInWeek > 0 && attemptedInWeek >= totalInWeek

            return (
              <Card key={week.id || week.week_number} className="p-0">
                <button
                  type="button"
                  onClick={() => onToggleWeek(week.week_number)}
                  className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-sm text-surface-muted">Week {week.week_number}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{week.title || `Week ${week.week_number}`}</h3>
                      {weekCompleted ? <Badge variant="success">Completed</Badge> : null}
                    </div>
                  </div>
                  <div className="text-right text-sm text-surface-muted">
                    <p>{isOpen ? 'Hide' : 'Show'}</p>
                    {!isWeekLoading && totalInWeek > 0 ? <p className="text-xs">{attemptedInWeek}/{totalInWeek} attempted</p> : null}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-surface-border px-5 py-4">
                    {isWeekLoading ? (
                      <div className="space-y-3">
                        <Skeleton height="72px" rounded="0.8rem" />
                        <Skeleton height="72px" rounded="0.8rem" />
                      </div>
                    ) : items.length ? (
                      <div className="space-y-3">{items.map((quiz) => renderQuizRow(quiz))}</div>
                    ) : (
                      <p className="text-sm text-surface-muted">No practice quizzes found for this week.</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'exam' && (
        <Card>
          {examLoading ? (
            <div className="space-y-3">
              <Skeleton height="68px" rounded="0.8rem" />
              <Skeleton height="68px" rounded="0.8rem" />
              <Skeleton height="68px" rounded="0.8rem" />
            </div>
          ) : !hasAnyExamPrep ? (
            <EmptyState
              icon="🧪"
              title="No exam prep quizzes"
              description="Exam preparation quizzes will appear here when available."
            />
          ) : (
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Quiz 1</h3>
                {examPrep.quiz1.length ? examPrep.quiz1.map(renderQuizRow) : <p className="text-sm text-surface-muted">No Quiz 1 items.</p>}
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Quiz 2</h3>
                {examPrep.quiz2.length ? examPrep.quiz2.map(renderQuizRow) : <p className="text-sm text-surface-muted">No Quiz 2 items.</p>}
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold">Endterm</h3>
                {examPrep.endterm.length ? examPrep.endterm.map(renderQuizRow) : <p className="text-sm text-surface-muted">No Endterm items.</p>}
              </section>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'ide' && (
        <Card>
          {ideLoading ? (
            <div className="space-y-3">
              <Skeleton height="68px" rounded="0.8rem" />
              <Skeleton height="68px" rounded="0.8rem" />
              <Skeleton height="68px" rounded="0.8rem" />
            </div>
          ) : !ideWeeks.length ? (
            <EmptyState
              icon="💻"
              title="No IDE problems"
              description="IDE practice problems will appear here when available."
            />
          ) : (
            <div className="space-y-5">
              {ideWeeks.map((weekGroup) => (
                <section key={`ide-week-${weekGroup.week_number}`} className="space-y-3">
                  <h3 className="text-lg font-semibold">Week {weekGroup.week_number}</h3>
                  <div className="space-y-3">
                    {(weekGroup.problems || []).map((problem) => (
                      <div key={problem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-100">{problem.title}</p>
                          <p className="mt-1 text-sm text-surface-muted">Language: {String(problem.language || 'python').toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'medium' ? 'warning' : 'danger'}>
                            {problem.difficulty}
                          </Badge>
                          <Link to={`/ide/${problem.id}`}>
                            <Button size="sm">Solve →</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Card>
      )}

      <Link to="/" className="inline-flex text-sm text-brand hover:text-brand-light">
        Back to courses
      </Link>
    </div>
  )
}
