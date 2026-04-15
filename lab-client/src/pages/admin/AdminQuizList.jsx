import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createAdminQuizApi,
  deleteAdminQuizApi,
  getAdminCoursesApi,
  getAdminQuizzesWithFilterApi,
  toggleAdminQuizApi,
  updateAdminQuizApi,
} from '../../api/admin.api'
import { getCourseWeeksApi } from '../../api/course.api'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import SlideOver from '../../components/ui/SlideOver'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Icon from '../../components/ui/Icon'

const sectionOptions = [
  { value: 'practice', label: 'Practice', icon: 'practice' },
  { value: 'quiz1', label: 'Quiz 1', icon: 'quiz' },
  { value: 'quiz2', label: 'Quiz 2', icon: 'book' },
  { value: 'endterm', label: 'End Term', icon: 'flag' },
]

const sectionBadgeMap = {
  practice: 'info',
  quiz1: 'success',
  quiz2: 'warning',
  endterm: 'danger',
}

export default function AdminQuizList() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [panelMode, setPanelMode] = useState(null)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [filters, setFilters] = useState({ course_id: '', section: '' })

  const initialForm = {
    course_id: '',
    section: 'practice',
    week_id: '',
    title: '',
    description: '',
    has_time_limit: true,
    time_limit_minutes: 15,
  }
  const [form, setForm] = useState(initialForm)

  const loadQuizzes = async () => {
    setLoading(true)
    try {
      const { data } = await getAdminQuizzesWithFilterApi({
        course_id: filters.course_id || undefined,
        section: filters.section || undefined,
      })
      setQuizzes(Array.isArray(data) ? data : data?.quizzes || [])
    } catch {
      toast.error('Unable to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
  }, [filters])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAdminCoursesApi()
        setCourses(Array.isArray(data) ? data : data?.courses || [])
      } catch {
        toast.error('Unable to load courses')
      }
    }

    load()
  }, [])

  const loadWeeksForCourse = async (courseId) => {
    const course = courses.find((item) => String(item.id) === String(courseId))
    if (!course) {
      setWeeks([])
      return
    }

    try {
      const { data } = await getCourseWeeksApi(course.slug)
      setWeeks(Array.isArray(data) ? data : [])
    } catch {
      setWeeks([])
      toast.error('Unable to load course weeks')
    }
  }

  const openCreatePanel = () => {
    setForm(initialForm)
    setWeeks([])
    setEditingQuiz(null)
    setPanelMode('create')
  }

  const openEditPanel = async (quiz) => {
    setEditingQuiz(quiz)
    setForm({
      course_id: String(quiz.course_id || ''),
      section: quiz.section || 'practice',
      week_id: quiz.week_id ? String(quiz.week_id) : '',
      title: quiz.title || '',
      description: quiz.description || '',
      has_time_limit: !!quiz.time_limit_minutes,
      time_limit_minutes: quiz.time_limit_minutes || 15,
    })
    if (quiz.course_id) {
      await loadWeeksForCourse(quiz.course_id)
    }
    setPanelMode('edit')
  }

  const onCourseChange = async (value) => {
    setForm((prev) => ({ ...prev, course_id: value, week_id: '' }))
    await loadWeeksForCourse(value)
  }

  const submitQuiz = async (mode) => {
    if (!form.course_id || !form.title.trim()) {
      toast.error('Course and title are required')
      return
    }
    if (form.section === 'practice' && !form.week_id) {
      toast.error('Week is required for practice section')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        course_id: Number(form.course_id),
        section: form.section,
        week_id: form.section === 'practice' ? Number(form.week_id) : null,
        title: form.title.trim(),
        description: form.description || null,
        time_limit_minutes: form.has_time_limit ? Number(form.time_limit_minutes || 15) : null,
      }

      if (mode === 'create') {
        const { data } = await createAdminQuizApi(payload)
        toast.success('Quiz created successfully')
        setPanelMode(null)
        await loadQuizzes()
        navigate(`/admin/quizzes/${data.id}`)
      } else if (editingQuiz) {
        await updateAdminQuizApi(editingQuiz.id, payload)
        toast.success('Quiz updated successfully')
        setPanelMode(null)
        await loadQuizzes()
      }
    } catch {
      toast.error('Unable to save quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleQuiz = async (quiz) => {
    try {
      await toggleAdminQuizApi(quiz.id)
      await loadQuizzes()
      toast.success('Quiz status updated')
    } catch {
      toast.error('Unable to toggle quiz')
    }
  }

  const onDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"?`)) return
    try {
      await deleteAdminQuizApi(quiz.id)
      toast.success('Quiz deleted')
      await loadQuizzes()
    } catch {
      toast.error('Unable to delete quiz')
    }
  }

  const renderForm = (mode) => (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-surface-muted">Course</label>
        <select
          value={form.course_id}
          onChange={(event) => onCourseChange(event.target.value)}
          className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
        >
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm text-surface-muted">Section</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {sectionOptions.map((section) => (
            <button
              type="button"
              key={section.value}
              onClick={() => setForm((prev) => ({ ...prev, section: section.value, week_id: '' }))}
              className={`rounded-xl border p-3 text-left ${
                form.section === section.value ? 'border-brand bg-brand/10' : 'border-surface-border bg-surface-raised'
              }`}
            >
              <Icon name={section.icon} size="md" className="text-surface-muted" />
              <p className="mt-1 text-sm font-semibold">{section.label}</p>
            </button>
          ))}
        </div>
      </div>

      {form.section === 'practice' ? (
        <div>
          <label className="mb-1 block text-sm text-surface-muted">Week</label>
          <select
            value={form.week_id}
            onChange={(event) => setForm((prev) => ({ ...prev, week_id: event.target.value }))}
            className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
          >
            <option value="">Select Week</option>
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>Week {week.week_number}</option>
            ))}
          </select>
        </div>
      ) : null}

      <Input
        label="Title"
        value={form.title}
        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
      />

      <div>
        <label className="mb-1 block text-sm text-surface-muted">Description</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          className="min-h-[100px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
        />
      </div>

      <div className="rounded-xl border border-surface-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.has_time_limit}
            onChange={(event) => setForm((prev) => ({ ...prev, has_time_limit: event.target.checked }))}
          />
          Time Limit
        </label>
        {form.has_time_limit ? (
          <div className="mt-3">
            <Input
              label="Minutes"
              type="number"
              value={form.time_limit_minutes}
              onChange={(event) => setForm((prev) => ({ ...prev, time_limit_minutes: event.target.value }))}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-surface-muted">Untimed</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setPanelMode(null)}>Cancel</Button>
        <Button loading={submitting} onClick={() => submitQuiz(mode)}>
          {mode === 'create' ? 'Create Quiz' : 'Save Quiz'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Quizzes</h1>
        <Button onClick={openCreatePanel}>Create Quiz</Button>
      </div>

      <Card className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-surface-muted">Course</label>
          <select
            value={filters.course_id}
            onChange={(event) => setFilters((prev) => ({ ...prev, course_id: event.target.value }))}
            className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-surface-muted">Section</label>
          <select
            value={filters.section}
            onChange={(event) => setFilters((prev) => ({ ...prev, section: event.target.value }))}
            className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="practice">Practice</option>
            <option value="quiz1">Quiz 1</option>
            <option value="quiz2">Quiz 2</option>
            <option value="endterm">Endterm</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="text-surface-muted">Loading quizzes...</p>
        </Card>
      ) : !quizzes.length ? (
        <EmptyState icon="quiz" title="No quizzes yet" description="Create and manage quizzes from this page." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-raised text-surface-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Section</th>
                <th className="px-3 py-2 font-medium">Week</th>
                <th className="px-3 py-2 font-medium">Questions</th>
                <th className="px-3 py-2 font-medium">Active</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="border-t border-surface-border hover:bg-surface-raised/60">
                  <td className="px-3 py-2 font-medium">{quiz.title}</td>
                  <td className="px-3 py-2">{quiz.course_name}</td>
                  <td className="px-3 py-2"><Badge variant={sectionBadgeMap[quiz.section] || 'default'}>{quiz.section}</Badge></td>
                  <td className="px-3 py-2">{quiz.section === 'practice' ? `Week ${quiz.week_number || '-'}` : '-'}</td>
                  <td className="px-3 py-2">{quiz.questions_count || 0}</td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={!!quiz.is_active} onChange={() => onToggleQuiz(quiz)} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/quizzes/${quiz.id}`}>
                        <Button size="sm">Manage</Button>
                      </Link>
                      <Button size="sm" variant="secondary" onClick={() => openEditPanel(quiz)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => onDeleteQuiz(quiz)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SlideOver
        isOpen={panelMode === 'create' || panelMode === 'edit'}
        onClose={() => setPanelMode(null)}
        title={panelMode === 'edit' ? 'Edit Quiz' : 'Create New Quiz'}
        width="560px"
      >
        {renderForm(panelMode === 'edit' ? 'edit' : 'create')}
      </SlideOver>
    </div>
  )
}
