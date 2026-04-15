import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAdminQuizzesApi } from '../../api/admin.api'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'

export default function AdminQuizList() {
  const [quizzes, setQuizzes] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAdminQuizzesApi()
        setQuizzes(Array.isArray(data) ? data : data?.quizzes || [])
      } catch {
        toast.error('Unable to load quizzes')
      }
    }

    load()
  }, [])

  if (!quizzes.length) {
    return <EmptyState icon="📝" title="No quizzes yet" description="Create and manage quizzes from this page." />
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{quiz.title}</h3>
            <p className="mt-1 text-sm text-surface-muted">Section: {quiz.section}</p>
          </div>
          <Link to={`/admin/quizzes/${quiz.id}`} className="text-sm font-semibold text-brand hover:text-brand-light">
            Manage
          </Link>
        </Card>
      ))}
    </div>
  )
}
