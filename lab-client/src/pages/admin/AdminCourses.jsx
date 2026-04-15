import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminCoursesApi } from '../../api/admin.api'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])

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

  if (!courses.length) {
    return <EmptyState icon="📚" title="No courses found" description="Create your first course from admin tools." />
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {courses.map((course) => (
        <Card key={course.id || course.slug}>
          <h3 className="text-lg font-semibold">{course.name}</h3>
          <p className="mt-2 text-sm text-surface-muted">{course.description}</p>
        </Card>
      ))}
    </div>
  )
}
