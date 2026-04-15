import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getIdeByCourseApi } from '../../api/ide.api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

export default function IDEProblemList() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [problems, setProblems] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await getIdeByCourseApi(slug)
        setProblems(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Unable to load IDE problems')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton height="78px" rounded="0.8rem" />
        <Skeleton height="78px" rounded="0.8rem" />
        <Skeleton height="78px" rounded="0.8rem" />
      </div>
    )
  }

  if (!problems.length) {
    return (
      <EmptyState
        icon="💻"
        title="No IDE problems"
        description="IDE coding problems are not available for this course yet."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">IDE Problems</h1>
        <p className="mt-1 text-sm text-surface-muted">Course: {slug}</p>
      </div>

      <div className="space-y-3">
        {problems.map((problem) => (
          <Card key={problem.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{problem.title}</h2>
              <p className="mt-1 text-sm text-surface-muted">{problem.description || 'Solve this coding challenge in the IDE.'}</p>
            </div>
            <div className="flex items-center gap-2">
              {problem.difficulty ? <Badge variant="warning">{problem.difficulty}</Badge> : null}
              <Link to={`/ide/${problem.id}`}>
                <Button size="sm">Solve</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
