import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import useAuth from '../../hooks/useAuth'
import { getStudentProfileApi, getStudentProgressApi, updateStudentProfileApi } from '../../api/student.api'

export default function Profile() {
  const { user, updateCurrentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [progressOverview, setProgressOverview] = useState(null)
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [removeAvatar, setRemoveAvatar] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [{ data: profileData }, { data: progressData }] = await Promise.all([
          getStudentProfileApi(),
          getStudentProgressApi(),
        ])

        setProfile(profileData)
        setProgressOverview(progressData?.overview || null)
        setName(profileData?.user?.name || '')
        setAvatarPreview(profileData?.user?.avatar || '')
      } catch {
        toast.error('Unable to load profile details')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const shownAvatar = useMemo(() => {
    if (removeAvatar) {
      return ''
    }

    return avatarPreview || profile?.user?.avatar || user?.avatar || ''
  }, [avatarPreview, profile?.user?.avatar, removeAvatar, user?.avatar])

  const onSelectAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setAvatarFile(file)
    setRemoveAvatar(false)

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const onSave = async (event) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name is required')
      return
    }

    const formData = new FormData()
    formData.append('name', trimmed)
    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }
    if (removeAvatar) {
      formData.append('remove_avatar', '1')
    }

    setSaving(true)
    try {
      const { data } = await updateStudentProfileApi(formData)
      const nextUser = data?.user || null
      if (nextUser) {
        updateCurrentUser(nextUser)
      }

      setProfile((prev) => ({
        ...(prev || {}),
        user: {
          ...(prev?.user || {}),
          ...(nextUser || {}),
        },
      }))

      setAvatarFile(null)
      if (removeAvatar) {
        setAvatarPreview('')
      }
      setRemoveAvatar(false)
      toast.success('Profile updated')
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update profile'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="180px" rounded="1rem" />
        <Skeleton height="320px" rounded="1rem" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">My Profile</h1>
            <p className="mt-1 text-sm text-surface-muted">
              Manage your account details and track your learning performance.
            </p>
          </div>
          <div className="text-right text-sm text-surface-muted">
            <p>{profile?.user?.email}</p>
            <p className="mt-1">Joined: {profile?.user?.joined_at ? new Date(profile.user.joined_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-surface-muted">Avg Score</p>
          <p className="mt-2 text-2xl font-semibold">{Number(profile?.stats?.avg_percentage || 0).toFixed(1)}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-surface-muted">Best Score</p>
          <p className="mt-2 text-2xl font-semibold">{Number(profile?.stats?.best_percentage || 0).toFixed(1)}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-surface-muted">Quiz Attempts</p>
          <p className="mt-2 text-2xl font-semibold">{profile?.stats?.completed_attempts || 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-surface-muted">IDE Solved</p>
          <p className="mt-2 text-2xl font-semibold">{profile?.stats?.ide_solved || progressOverview?.ide_solved || 0}</p>
        </Card>
      </div>

      <Card>
        <form onSubmit={onSave} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={shownAvatar || 'https://api.dicebear.com/9.x/initials/svg?seed=LAB'}
              alt="profile avatar"
              className="h-20 w-20 rounded-full border border-surface-border object-cover"
            />
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-sm font-medium hover:bg-[#232d40]">
                Upload Avatar
                <input type="file" accept="image/*" onChange={onSelectAvatar} className="hidden" />
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarPreview('')
                    setRemoveAvatar(true)
                  }}
                  className="text-sm text-danger hover:underline"
                >
                  Remove Avatar
                </button>
              </div>
            </div>
          </div>

          <Input
            label="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
