import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminIdeProblemsApi } from '../../api/admin.api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

export default function AdminIDEProblems() {
  const [problems, setProblems] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAdminIdeProblemsApi()
        setProblems(Array.isArray(data) ? data : data?.problems || [])
      } catch {
        toast.error('Unable to load IDE problems')
      }
    }

    load()
  }, [])

  if (!problems.length) {
    return <EmptyState icon="💻" title="No IDE problems" description="Add coding problems to power practical exercises." />
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {problems.map((problem) => (
        <Card key={problem.id}>
          <h3 className="text-lg font-semibold">{problem.title}</h3>
          <p className="mt-2 text-sm text-surface-muted">{problem.description}</p>
          <div className="mt-3">
            <Badge variant="info">{problem.language || 'python'}</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
