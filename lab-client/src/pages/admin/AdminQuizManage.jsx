import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAdminQuizApi } from '../../api/admin.api'
import Card from '../../components/ui/Card'
import RichText from '../../components/shared/RichText'

export default function AdminQuizManage() {
  const { id } = useParams()
  const [quiz, setQuiz] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAdminQuizApi(id)
        setQuiz(data?.quiz || data)
      } catch {
        toast.error('Unable to load quiz details')
      }
    }

    load()
  }, [id])

  return (
    <Card>
      <h2 className="text-xl font-semibold">{quiz?.title || `Quiz ${id}`}</h2>
      <div className="mt-3 text-sm text-surface-muted">
        <RichText content={quiz?.description || 'Manage questions, sections, and visibility settings for this quiz.'} />
      </div>
    </Card>
  )
}
