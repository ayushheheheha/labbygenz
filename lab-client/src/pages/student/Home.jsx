import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getCoursesApi } from '../../api/course.api'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import { getStudentProgressApi } from '../../api/student.api'
import { CourseIcon } from '../../components/ui/Icon'

export default function Home() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [progressBySlug, setProgressBySlug] = useState({})

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [{ data: coursesData }, { data: progressData }] = await Promise.all([
          getCoursesApi(),
          getStudentProgressApi(),
        ])

        const normalizedCourses = Array.isArray(coursesData) ? coursesData : coursesData?.courses || []
        setCourses(normalizedCourses)

        const rows = Array.isArray(progressData?.course_progress) ? progressData.course_progress : []
        const map = rows.reduce((acc, row) => {
          acc[row.course_slug] = row
          return acc
        }, {})
        setProgressBySlug(map)
      } catch {
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton width="260px" height="34px" />
          <Skeleton className="mt-2" width="180px" height="18px" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height="40px" width="40px" rounded="0.5rem" />
              <Skeleton className="mt-4" height="24px" width="62%" />
              <Skeleton className="mt-3" height="16px" width="90%" />
              <Skeleton className="mt-2" height="16px" width="76%" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!courses.length) {
    return (
      <EmptyState
        icon="courses"
        title="No courses available"
        description="Your enrolled courses will appear here once they are published."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.75rem] font-semibold">Hey, {user?.name || 'Student'}</h1>
        <p className="mt-1 text-sm text-surface-muted">Ready to practice?</p>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Your Courses</h2>
        <Badge variant="info">{courses.length}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id || course.slug} to={`/courses/${course.slug}`}>
            <Card className="h-full rounded-2xl border border-surface-border p-6 transition duration-200 hover:-translate-y-[3px] hover:border-brand/70 hover:shadow-glow">
              {progressBySlug[course.slug] ? (
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-surface-muted">
                    <span>Progress</span>
                    <span>{Math.round(Number(progressBySlug[course.slug]?.completion_percent || 0))}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, Number(progressBySlug[course.slug]?.completion_percent || 0)))}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-surface-border bg-surface-raised text-surface-muted">
                <CourseIcon value={course.icon} size="lg" />
              </div>
              <h3 className="mt-4 text-[1.1rem] font-bold">{course.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-surface-muted">
                {course.description || 'Practice and revise your concepts.'}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-surface-muted">
                  {progressBySlug[course.slug]
                    ? `${progressBySlug[course.slug].attempted_quizzes || 0}/${progressBySlug[course.slug].total_quizzes || 0} quizzes done`
                    : 'Open course'}
                </span>
                {course.has_ide ? <Badge variant="info">IDE</Badge> : null}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
