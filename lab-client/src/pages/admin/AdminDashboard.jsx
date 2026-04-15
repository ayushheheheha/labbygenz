import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminStatsApi } from '../../api/admin.api'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAdminStatsApi()
        setStats(data)
      } catch {
        toast.error('Unable to load admin stats')
      }
    }

    load()
  }, [])

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Skeleton height="22px" width="60%" />
            <Skeleton className="mt-3" height="28px" width="40%" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <p className="text-sm text-surface-muted">Users</p>
        <p className="mt-2 text-3xl font-semibold">{stats.users ?? '-'}</p>
      </Card>
      <Card>
        <p className="text-sm text-surface-muted">Courses</p>
        <p className="mt-2 text-3xl font-semibold">{stats.courses ?? '-'}</p>
      </Card>
      <Card>
        <p className="text-sm text-surface-muted">Attempts</p>
        <p className="mt-2 text-3xl font-semibold">{stats.attempts ?? '-'}</p>
      </Card>
    </div>
  )
}
