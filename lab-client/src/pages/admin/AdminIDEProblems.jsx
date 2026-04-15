import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  addAdminIdeTestCaseApi,
  createAdminIdeProblemApi,
  deleteAdminIdeProblemApi,
  deleteAdminIdeTestCaseApi,
  getAdminCoursesApi,
  getAdminIdeProblemApi,
  getAdminIdeProblemsApi,
  updateAdminIdeProblemApi,
  updateAdminIdeTestCaseApi,
} from '../../api/admin.api'
import { getCourseWeeksApi } from '../../api/course.api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import SlideOver from '../../components/ui/SlideOver'
import Input from '../../components/ui/Input'

const difficultyOptions = ['easy', 'medium', 'hard']
const languageOptions = ['python', 'java', 'cpp']

const emptyTestCase = () => ({
  input: '',
  expected_output: '',
  is_hidden: false,
})

const initialForm = {
  course_id: '',
  week_number: '',
  title: '',
  description: '',
  constraints: '',
  input_format: '',
  output_format: '',
  sample_input: '',
  sample_output: '',
  difficulty: 'medium',
  language: 'python',
  time_limit_seconds: 2,
  memory_limit_mb: 256,
  is_active: true,
  sort_order: 0,
  test_cases: [emptyTestCase()],
}

export default function AdminIDEProblems() {
  const [problems, setProblems] = useState([])
  const [courses, setCourses] = useState([])
  const [weeks, setWeeks] = useState([])
  const [loading, setLoading] = useState(true)
  const [panelMode, setPanelMode] = useState(null)
  const [editingProblem, setEditingProblem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(initialForm)

  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((course) => [String(course.id), course])),
    [courses],
  )

  const loadProblems = async () => {
    setLoading(true)
    try {
      const { data } = await getAdminIdeProblemsApi()
      setProblems(Array.isArray(data) ? data : data?.problems || [])
    } catch {
      toast.error('Unable to load IDE problems')
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    loadProblems()
  }, [])

  const loadWeeksForCourse = async (courseId) => {
    const course = courseMap[String(courseId)]
    if (!course?.slug) {
      setWeeks([])
      return
    }

    try {
      const { data } = await getCourseWeeksApi(course.slug)
      const weekList = Array.isArray(data) ? data : []
      setWeeks(weekList)
    } catch {
      setWeeks([])
      toast.error('Unable to load weeks')
    }
  }

  const openCreatePanel = async () => {
    setEditingProblem(null)
    setForm(initialForm)
    setWeeks([])
    setPanelMode('create')
  }

  const openEditPanel = async (problem) => {
    try {
      const { data } = await getAdminIdeProblemApi(problem.id)
      const details = data || {}

      setEditingProblem(details)
      setForm({
        course_id: String(details.course_id || ''),
        week_number: details.week_number ? String(details.week_number) : '',
        title: details.title || '',
        description: details.description || '',
        constraints: details.constraints || '',
        input_format: details.input_format || '',
        output_format: details.output_format || '',
        sample_input: details.sample_input || '',
        sample_output: details.sample_output || '',
        difficulty: details.difficulty || 'medium',
        language: details.language || 'python',
        time_limit_seconds: details.time_limit_seconds || 2,
        memory_limit_mb: details.memory_limit_mb || 256,
        is_active: !!details.is_active,
        sort_order: details.sort_order || 0,
        test_cases: (details.test_cases || []).map((testCase) => ({
          id: testCase.id,
          input: testCase.input || '',
          expected_output: testCase.expected_output || '',
          is_hidden: !!testCase.is_hidden,
        })),
      })

      await loadWeeksForCourse(details.course_id)
      setPanelMode('edit')
    } catch {
      toast.error('Unable to load IDE problem details')
    }
  }

  const onCourseChange = async (value) => {
    setForm((prev) => ({ ...prev, course_id: value, week_number: '' }))
    await loadWeeksForCourse(value)
  }

  const updateTestCase = (index, key, value) => {
    setForm((prev) => {
      const testCases = [...prev.test_cases]
      testCases[index] = { ...testCases[index], [key]: value }
      return { ...prev, test_cases: testCases }
    })
  }

  const addTestCaseRow = () => {
    setForm((prev) => ({
      ...prev,
      test_cases: [...prev.test_cases, emptyTestCase()],
    }))
  }

  const removeTestCaseRow = (index) => {
    setForm((prev) => {
      if (prev.test_cases.length === 1) return prev
      return {
        ...prev,
        test_cases: prev.test_cases.filter((_, i) => i !== index),
      }
    })
  }

  const validateForm = () => {
    if (!form.course_id || !form.title.trim() || !form.description.trim()) {
      toast.error('Course, title and description are required')
      return false
    }

    if (!form.sample_input.trim() || !form.sample_output.trim()) {
      toast.error('Sample input and sample output are required')
      return false
    }

    if (!form.week_number) {
      toast.error('Week number is required')
      return false
    }

    const hasInvalidTestCase = form.test_cases.some((testCase) => !testCase.input.trim() || !testCase.expected_output.trim())
    if (hasInvalidTestCase) {
      toast.error('Each test case needs input and expected output')
      return false
    }

    return true
  }

  const submitForm = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        course_id: Number(form.course_id),
        week_number: Number(form.week_number),
        title: form.title.trim(),
        description: form.description,
        constraints: form.constraints || null,
        input_format: form.input_format || null,
        output_format: form.output_format || null,
        sample_input: form.sample_input,
        sample_output: form.sample_output,
        difficulty: form.difficulty,
        language: form.language,
        time_limit_seconds: Number(form.time_limit_seconds || 2),
        memory_limit_mb: Number(form.memory_limit_mb || 256),
        is_active: !!form.is_active,
        sort_order: Number(form.sort_order || 0),
      }

      if (panelMode === 'create') {
        payload.test_cases = form.test_cases.map((testCase) => ({
          input: testCase.input,
          expected_output: testCase.expected_output,
          is_hidden: !!testCase.is_hidden,
        }))

        await createAdminIdeProblemApi(payload)
        toast.success('IDE problem created')
      } else if (panelMode === 'edit' && editingProblem) {
        await updateAdminIdeProblemApi(editingProblem.id, payload)

        const originalIds = new Set((editingProblem.test_cases || []).map((testCase) => testCase.id))
        const currentIds = new Set(form.test_cases.filter((testCase) => testCase.id).map((testCase) => testCase.id))

        for (const testCase of form.test_cases) {
          if (testCase.id) {
            await updateAdminIdeTestCaseApi(testCase.id, {
              input: testCase.input,
              expected_output: testCase.expected_output,
              is_hidden: !!testCase.is_hidden,
            })
          } else {
            await addAdminIdeTestCaseApi(editingProblem.id, {
              input: testCase.input,
              expected_output: testCase.expected_output,
              is_hidden: !!testCase.is_hidden,
            })
          }
        }

        for (const originalId of originalIds) {
          if (!currentIds.has(originalId)) {
            await deleteAdminIdeTestCaseApi(originalId)
          }
        }

        toast.success('IDE problem updated')
      }

      setPanelMode(null)
      setEditingProblem(null)
      setForm(initialForm)
      await loadProblems()
    } catch {
      toast.error('Unable to save IDE problem')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (problem) => {
    if (!window.confirm(`Delete IDE problem "${problem.title}"?`)) return

    try {
      await deleteAdminIdeProblemApi(problem.id)
      toast.success('IDE problem deleted')
      await loadProblems()
    } catch {
      toast.error('Unable to delete IDE problem')
    }
  }

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
          <label className="mb-1 block text-sm text-surface-muted">Week</label>
          <select
            value={form.week_number}
            onChange={(event) => setForm((prev) => ({ ...prev, week_number: event.target.value }))}
            className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
          >
            <option value="">Select Week</option>
            {weeks.map((week) => (
              <option key={week.id} value={week.week_number}>Week {week.week_number}</option>
            ))}
          </select>
        </div>
      </div>

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
          className="min-h-[120px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-surface-muted">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}
            className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
          >
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-surface-muted">Language</label>
          <select
            value={form.language}
            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
            className="w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
          >
            {languageOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="number"
          label="Time Limit (seconds)"
          value={form.time_limit_seconds}
          onChange={(event) => setForm((prev) => ({ ...prev, time_limit_seconds: event.target.value }))}
        />
        <Input
          type="number"
          label="Memory Limit (MB)"
          value={form.memory_limit_mb}
          onChange={(event) => setForm((prev) => ({ ...prev, memory_limit_mb: event.target.value }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-surface-muted">Input Format</label>
        <textarea
          value={form.input_format}
          onChange={(event) => setForm((prev) => ({ ...prev, input_format: event.target.value }))}
          className="min-h-[80px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-surface-muted">Output Format</label>
        <textarea
          value={form.output_format}
          onChange={(event) => setForm((prev) => ({ ...prev, output_format: event.target.value }))}
          className="min-h-[80px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-surface-muted">Constraints</label>
        <textarea
          value={form.constraints}
          onChange={(event) => setForm((prev) => ({ ...prev, constraints: event.target.value }))}
          className="min-h-[80px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-surface-muted">Sample Input</label>
          <textarea
            value={form.sample_input}
            onChange={(event) => setForm((prev) => ({ ...prev, sample_input: event.target.value }))}
            className="min-h-[90px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-surface-muted">Sample Output</label>
          <textarea
            value={form.sample_output}
            onChange={(event) => setForm((prev) => ({ ...prev, sample_output: event.target.value }))}
            className="min-h-[90px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <Input
        type="number"
        label="Sort Order"
        value={form.sort_order}
        onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
      />

      <label className="flex items-center gap-2 text-sm text-surface-muted">
        <input
          type="checkbox"
          checked={!!form.is_active}
          onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
        />
        Active problem
      </label>

      <div className="rounded-xl border border-surface-border p-3">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Test Cases</h4>
          <Button size="sm" variant="secondary" onClick={addTestCaseRow}>Add Case</Button>
        </div>
        <div className="space-y-3">
          {form.test_cases.map((testCase, index) => (
            <div key={testCase.id || `new-${index}`} className="rounded-lg border border-surface-border bg-surface-raised p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Test Case {index + 1}</p>
                <Button size="sm" variant="ghost" onClick={() => removeTestCaseRow(index)}>Remove</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-surface-muted">Input</label>
                  <textarea
                    value={testCase.input}
                    onChange={(event) => updateTestCase(index, 'input', event.target.value)}
                    className="min-h-[80px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-surface-muted">Expected Output</label>
                  <textarea
                    value={testCase.expected_output}
                    onChange={(event) => updateTestCase(index, 'expected_output', event.target.value)}
                    className="min-h-[80px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-surface-muted">
                <input
                  type="checkbox"
                  checked={!!testCase.is_hidden}
                  onChange={(event) => updateTestCase(index, 'is_hidden', event.target.checked)}
                />
                Hidden test case
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-surface-border pt-3">
        <Button variant="ghost" onClick={() => setPanelMode(null)}>Cancel</Button>
        <Button onClick={submitForm} loading={submitting}>{panelMode === 'create' ? 'Create Problem' : 'Save Changes'}</Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">IDE Problems</h2>
        <Button onClick={openCreatePanel}>Add IDE Problem</Button>
      </div>

      {!loading && !problems.length ? (
        <EmptyState icon="code" title="No IDE problems" description="Add coding problems to power practical exercises." />
      ) : null}

      {!!problems.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-raised text-left text-surface-muted">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Week</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Tests</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem) => (
                  <tr key={problem.id} className="border-t border-surface-border">
                    <td className="px-4 py-3 font-medium">{problem.title}</td>
                    <td className="px-4 py-3">{problem.course_name || '-'}</td>
                    <td className="px-4 py-3">{problem.week_number ? `Week ${problem.week_number}` : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'medium' ? 'warning' : 'danger'}>
                        {problem.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{problem.language}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {problem.test_cases_count || 0}
                      <span className="ml-1 text-xs text-surface-muted">({problem.hidden_test_cases_count || 0} hidden)</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={problem.is_active ? 'success' : 'warning'}>{problem.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditPanel(problem)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(problem)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <SlideOver
        isOpen={panelMode === 'create' || panelMode === 'edit'}
        onClose={() => setPanelMode(null)}
        title={panelMode === 'create' ? 'Create IDE Problem' : 'Edit IDE Problem'}
        width="820px"
      >
        {renderForm()}
      </SlideOver>
    </>
  )
}
