import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import { getIdeProblemApi, runIdeProblemApi } from '../../api/ide.api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function IDEPractice() {
  const { problemId } = useParams()
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState('print("Hello LAB")')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getIdeProblemApi(problemId)
        setProblem(data?.problem || data)
      } catch {
        toast.error('Unable to load IDE problem')
      }
    }

    load()
  }, [problemId])

  const onRun = async () => {
    setLoading(true)
    try {
      const { data } = await runIdeProblemApi(problemId, { code, language: problem?.language || 'python' })
      setOutput(JSON.stringify(data, null, 2))
    } catch {
      toast.error('Code execution failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">{problem?.title || `IDE Problem ${problemId}`}</h2>
        <p className="mt-2 text-sm text-surface-muted">{problem?.description || 'Write and test your solution.'}</p>
      </Card>

      <Card>
        <Editor
          height="360px"
          defaultLanguage={(problem?.language || 'python').toLowerCase()}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
        />
        <div className="mt-4">
          <Button onClick={onRun} loading={loading}>Run Code</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-surface-muted">Output</h3>
        <pre className="max-h-64 overflow-auto rounded-xl border border-surface-border bg-black/30 p-3 text-xs">{output || 'Execution output appears here.'}</pre>
      </Card>
    </div>
  )
}
