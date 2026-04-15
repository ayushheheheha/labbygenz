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
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height="22px" width="50%" />
              <Skeleton className="mt-3" height="36px" width="35%" />
            </Card>
          ))}
        </div>
        <Card>
          <Skeleton height="24px" width="180px" />
          <Skeleton className="mt-4" height="220px" width="100%" />
        </Card>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Students', value: stats.total_students ?? 0, icon: '🎓' },
    { label: 'Total Quizzes', value: stats.total_quizzes ?? 0, icon: '📝' },
    { label: 'Total Questions', value: stats.total_questions ?? 0, icon: '❓' },
    { label: "Today's Attempts", value: stats.total_attempts_today ?? 0, icon: '📈' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {statCards.map((item) => (
          <Card key={item.label} className="rounded-2xl">
            <p className="text-2xl">{item.icon}</p>
            <p className="mt-3 text-[2rem] font-bold leading-none">{item.value}</p>
            <p className="mt-1 text-sm text-surface-muted">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Recent Attempts</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-surface-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-raised text-surface-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Student</th>
                <th className="px-3 py-2 font-medium">Quiz</th>
                <th className="px-3 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent_attempts || []).map((attempt, index) => (
                <tr key={`${attempt.submitted_at || ''}-${index}`} className="border-t border-surface-border text-slate-200 transition hover:bg-surface-raised/70">
                  <td className="px-3 py-2">{attempt.student_name || '-'}</td>
                  <td className="px-3 py-2">{attempt.quiz_title || '-'}</td>
                  <td className="px-3 py-2">{attempt.course_name || '-'}</td>
                  <td className="px-3 py-2">{attempt.score}/{attempt.total_marks}</td>
                  <td className="px-3 py-2 text-surface-muted">
                    {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
