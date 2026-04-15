import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getAdminCoursesApi,
  toggleAdminCourseApi,
  updateAdminCourseApi,
} from '../../api/admin.api'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import SlideOver from '../../components/ui/SlideOver'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '📘',
    has_ide: false,
  })

  const loadCourses = async () => {
    try {
      const { data } = await getAdminCoursesApi()
      setCourses(Array.isArray(data) ? data : data?.courses || [])
    } catch {
      toast.error('Unable to load courses')
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const openEditor = (course) => {
    setEditing(course)
    setForm({
      name: course.name || '',
      description: course.description || '',
      icon: course.icon || '📘',
      has_ide: !!course.has_ide,
    })
  }

  const handleToggle = async (courseId) => {
    try {
      await toggleAdminCourseApi(courseId)
      setCourses((prev) => prev.map((course) => (
        course.id === courseId ? { ...course, is_active: !course.is_active } : course
      )))
      toast.success('Course status updated')
    } catch {
      toast.error('Unable to update course status')
    }
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const { data } = await updateAdminCourseApi(editing.id, form)
      setCourses((prev) => prev.map((course) => (course.id === editing.id ? data : course)))
      setEditing(null)
      toast.success('Course updated successfully')
    } catch {
      toast.error('Unable to update course')
    } finally {
      setSaving(false)
    }
  }

  if (!courses.length) {
    return <EmptyState icon="📚" title="No courses found" description="Create your first course from admin tools." />
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id || course.slug} className="rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl">{course.icon || '📘'}</p>
                <h3 className="mt-2 text-lg font-semibold">{course.name}</h3>
              </div>
              <Badge variant={course.is_active ? 'success' : 'warning'}>
                {course.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-surface-muted">{course.description || 'No description.'}</p>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-surface-muted">
                <input
                  type="checkbox"
                  checked={!!course.is_active}
                  onChange={() => handleToggle(course.id)}
                />
                Toggle Active
              </label>
              <Button size="sm" variant="secondary" onClick={() => openEditor(course)}>
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <SlideOver isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Course" width="520px">
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm text-surface-muted">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-[120px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm"
            />
          </div>
          <Input
            label="Icon"
            value={form.icon}
            onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-surface-muted">
            <input
              type="checkbox"
              checked={!!form.has_ide}
              onChange={(event) => setForm((prev) => ({ ...prev, has_ide: event.target.checked }))}
            />
            Has IDE Practice
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </SlideOver>
    </>
  )
}
