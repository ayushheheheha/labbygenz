import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import { getIdeProblemApi, myIdeSubmissionsApi, runIdeProblemApi, submitIdeProblemApi } from '../../api/ide.api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import RichText from '../../components/shared/RichText'
import Badge from '../../components/ui/Badge'

const SPLITTER_HEIGHT = 10
const MIN_TOP_PANE = 220
const MIN_BOTTOM_PANE = 180

const STARTER_CODE = {
  python: '# Write your solution here\nimport sys\ninput = sys.stdin.readline\n\n',
  java: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}',
  cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    \n    return 0;\n}',
}

function mapLanguageToMonaco(language) {
  if (language === 'cpp') return 'cpp'
  return language || 'python'
}

function timeAgo(value) {
  if (!value) return '-'
  const d = new Date(value).getTime()
  const diffSec = Math.floor((Date.now() - d) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDisplayText(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

export default function IDEPractice() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const rightPanelRef = useRef(null)
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState('problem')
  const [submissions, setSubmissions] = useState([])
  const [runLoading, setRunLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [resultMode, setResultMode] = useState(null)
  const [runResults, setRunResults] = useState([])
  const [submitResult, setSubmitResult] = useState(null)
  const [topPanePx, setTopPanePx] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const sampleTestCases = useMemo(() => {
    const all = problem?.test_cases || problem?.testCases || []
    return Array.isArray(all) ? all : []
  }, [problem])

  const language = (problem?.language || 'python').toLowerCase()

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  useEffect(() => {
    const panel = rightPanelRef.current
    if (!panel) return undefined

    const clampTop = (value, totalHeight) => {
      const maxTop = Math.max(MIN_TOP_PANE, totalHeight - MIN_BOTTOM_PANE - SPLITTER_HEIGHT)
      return Math.min(Math.max(value, MIN_TOP_PANE), maxTop)
    }

    const syncSize = () => {
      const total = panel.clientHeight || 0
      if (!total) return
      setTopPanePx((prev) => {
        if (prev === null) {
          return clampTop(Math.round(total * 0.62), total)
        }
        return clampTop(prev, total)
      })
    }

    syncSize()
    const observer = new ResizeObserver(syncSize)
    observer.observe(panel)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getIdeProblemApi(problemId)
        const resolved = data?.problem || data
        setProblem(resolved)
        setCode((prev) => prev || STARTER_CODE[(resolved?.language || 'python').toLowerCase()] || STARTER_CODE.python)
      } catch {
        toast.error('Unable to load IDE problem')
      }
    }

    load()
  }, [problemId])

  useEffect(() => {
    if (activeTab !== 'submissions') return

    const loadSubmissions = async () => {
      try {
        const { data } = await myIdeSubmissionsApi(problemId)
        setSubmissions(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Unable to load submissions')
      }
    }

    loadSubmissions()
  }, [activeTab, problemId])

  const onResetCode = () => {
    setCode(STARTER_CODE[language] || STARTER_CODE.python)
  }

  const onRun = async () => {
    setRunLoading(true)
    try {
      const { data } = await runIdeProblemApi(problemId, {
        language,
        code,
      })

      setResultMode('run')
      setRunResults(Array.isArray(data?.test_results) ? data.test_results : [])
      setSubmitResult(null)
    } catch {
      toast.error('Code execution failed')
    } finally {
      setRunLoading(false)
    }
  }

  const onSubmit = async () => {
    setSubmitLoading(true)
    try {
      const { data } = await submitIdeProblemApi(problemId, {
        language,
        code,
      })

      setResultMode('submit')
      setSubmitResult(data)
      setRunResults([])
      toast.success('Submission completed')
      const submissionsRes = await myIdeSubmissionsApi(problemId)
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : [])
    } catch {
      toast.error('Submission failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  const onOpenSubmission = async (submissionId) => {
    try {
      const { data } = await getIdeProblemApi(problemId, { submission_id: submissionId })
      if (data?.selected_submission?.code) {
        setCode(data.selected_submission.code)
        toast.success('Submission code loaded')
      }
    } catch {
      toast.error('Unable to load submission code')
    }
  }

  const startResize = (event) => {
    event.preventDefault()
    const panel = rightPanelRef.current
    if (!panel) return

    const handle = event.currentTarget
    if (handle?.setPointerCapture && event.pointerId !== undefined) {
      handle.setPointerCapture(event.pointerId)
    }

    setIsDragging(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'

    const onMove = (moveEvent) => {
      const rect = panel.getBoundingClientRect()
      const y = moveEvent.clientY - rect.top
      const maxTop = Math.max(MIN_TOP_PANE, rect.height - MIN_BOTTOM_PANE - SPLITTER_HEIGHT)
      const clamped = Math.min(Math.max(y, MIN_TOP_PANE), maxTop)
      setTopPanePx(clamped)
    }

    const onUp = () => {
      setIsDragging(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)

      if (handle?.releasePointerCapture && event.pointerId !== undefined) {
        try {
          handle.releasePointerCapture(event.pointerId)
        } catch {
          // no-op
        }
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const runPassed = runResults.filter((item) => item.passed).length

  const verdictMap = {
    accepted: { label: 'Accepted', color: 'text-success', icon: '✅' },
    wrong_answer: { label: 'Wrong Answer', color: 'text-danger', icon: '❌' },
    runtime_error: { label: 'Runtime Error', color: 'text-warning', icon: '⚠️' },
    time_limit_exceeded: { label: 'Time Limit Exceeded', color: 'text-warning', icon: '⏱' },
  }

  const verdict = submitResult?.status ? verdictMap[submitResult.status] || verdictMap.wrong_answer : null

  const gridTop = topPanePx ?? 360

  return (
    <div className="h-screen overflow-hidden bg-surface px-4 py-4 lg:px-6">
      <div className="grid h-full gap-4 lg:grid-cols-[40%_60%]">
        <Card className="h-full overflow-hidden p-0">
          <div className="flex h-full flex-col">
            <div className="border-b border-surface-border p-4">
              <button type="button" onClick={() => navigate(-1)} className="text-sm text-brand hover:text-brand-light">← Back</button>
              <h1 className="mt-2 text-xl font-semibold">{problem?.title || `Problem ${problemId}`}</h1>
              <div className="mt-2 flex gap-2">
                <Badge variant={problem?.difficulty === 'easy' ? 'success' : problem?.difficulty === 'medium' ? 'warning' : 'danger'}>
                  {problem?.difficulty || 'medium'}
                </Badge>
              </div>
            </div>

            <div className="border-b border-surface-border px-4 pt-3">
              <div className="inline-flex rounded-lg border border-surface-border bg-[#0d1117] p-1 text-sm">
                <button type="button" onClick={() => setActiveTab('problem')} className={`rounded-md px-3 py-1 ${activeTab === 'problem' ? 'bg-brand text-white' : 'text-surface-muted'}`}>Problem</button>
                <button type="button" onClick={() => setActiveTab('submissions')} className={`rounded-md px-3 py-1 ${activeTab === 'submissions' ? 'bg-brand text-white' : 'text-surface-muted'}`}>Submissions</button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {activeTab === 'problem' ? (
                <div className="space-y-5">
                  <section>
                    <RichText content={problem?.description || 'Solve this problem using the editor on the right.'} />
                  </section>

                  {problem?.constraints ? (
                    <section>
                      <h3 className="text-sm font-semibold text-surface-muted">Constraints</h3>
                      <pre className="mt-2 rounded-lg border border-surface-border bg-surface-raised p-3 text-xs whitespace-pre-wrap">{formatDisplayText(problem.constraints)}</pre>
                    </section>
                  ) : null}

                  {problem?.input_format ? (
                    <section>
                      <h3 className="text-sm font-semibold text-surface-muted">Input Format</h3>
                      <pre className="mt-2 rounded-lg border border-surface-border bg-surface-raised p-3 text-xs whitespace-pre-wrap">{formatDisplayText(problem.input_format)}</pre>
                    </section>
                  ) : null}

                  {problem?.output_format ? (
                    <section>
                      <h3 className="text-sm font-semibold text-surface-muted">Output Format</h3>
                      <pre className="mt-2 rounded-lg border border-surface-border bg-surface-raised p-3 text-xs whitespace-pre-wrap">{formatDisplayText(problem.output_format)}</pre>
                    </section>
                  ) : null}

                  <section>
                    <h3 className="text-sm font-semibold text-surface-muted">Sample Test Cases</h3>
                    <div className="mt-3 space-y-3">
                      {sampleTestCases.map((testCase, index) => (
                        <div key={testCase.id || index} className="grid gap-2 rounded-xl border border-surface-border bg-surface-raised p-3 md:grid-cols-2">
                          <div>
                            <p className="mb-1 text-xs text-surface-muted">Input</p>
                            <pre className="rounded-md bg-[#0d1117] p-2 text-xs whitespace-pre-wrap">{formatDisplayText(testCase.input)}</pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-surface-muted">Expected Output</p>
                            <pre className="rounded-md bg-[#0d1117] p-2 text-xs whitespace-pre-wrap">{formatDisplayText(testCase.expected_output)}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-2">
                  {!submissions.length ? (
                    <p className="rounded-lg border border-surface-border bg-surface-raised p-3 text-sm text-surface-muted">No submissions yet.</p>
                  ) : submissions.map((submission) => (
                    <button
                      key={submission.id}
                      type="button"
                      onClick={() => onOpenSubmission(submission.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-left hover:border-brand/60"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={submission.status === 'accepted' ? 'success' : submission.status === 'wrong_answer' ? 'danger' : 'warning'}>{submission.status}</Badge>
                        <Badge>{submission.language}</Badge>
                      </div>
                      <span className="text-xs text-surface-muted">{timeAgo(submission.submitted_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div
          ref={rightPanelRef}
          className={`grid h-full min-h-0 ${isDragging ? 'select-none' : ''}`}
          style={{ gridTemplateRows: `${gridTop}px ${SPLITTER_HEIGHT}px minmax(0, 1fr)` }}
        >
          <Card className="min-h-0 overflow-hidden p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <p className="text-sm font-semibold">{language === 'cpp' ? 'C++' : language === 'java' ? 'Java' : 'Python'} 3</p>
                <Button size="sm" variant="ghost" onClick={onResetCode}>Reset Code</Button>
              </div>
              <div className="min-h-0 flex-1">
                <Editor
                  height="100%"
                  language={mapLanguageToMonaco(language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontFamily: 'Fira Code',
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'off',
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </Card>

          <div
            role="separator"
            aria-orientation="horizontal"
            onPointerDown={startResize}
            className="relative flex h-[18px] touch-none cursor-row-resize items-center justify-center"
            title="Drag to resize"
          >
            <div
              className={`pointer-events-none flex h-6 w-12 items-center justify-center rounded-full border transition ${
                isDragging
                  ? 'border-brand/80 bg-brand/20'
                  : 'border-surface-border bg-surface-raised hover:border-brand/60'
              }`}
            >
              <div className="space-y-[3px]">
                <div className="h-[2px] w-5 rounded-full bg-surface-muted/80" />
                <div className="h-[2px] w-5 rounded-full bg-surface-muted/80" />
              </div>
            </div>
          </div>

          <Card className="min-h-0 overflow-hidden p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-surface-border px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="secondary" loading={runLoading} onClick={onRun}>Run</Button>
                  <Button loading={submitLoading} onClick={onSubmit}>Submit</Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {resultMode === 'run' ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Sample Test Results - {runPassed}/{runResults.length} Passed</h3>
                    {runResults.map((item) => (
                      <div key={`run-${item.case_number}`} className="rounded-lg border border-surface-border bg-surface-raised p-3 text-xs">
                        <p className="font-semibold">Case {item.case_number} {item.passed ? '✓' : '✗'}</p>
                        <div className="mt-2">
                          <p className="text-surface-muted">Input:</p>
                          <p className="font-mono whitespace-pre-wrap">{formatDisplayText(item.input)}</p>
                        </div>
                        <div>
                          <p className="text-surface-muted">Expected:</p>
                          <p className="font-mono whitespace-pre-wrap">{formatDisplayText(item.expected)}</p>
                        </div>
                        <div>
                          <p className="text-surface-muted">Got:</p>
                          <p className="font-mono whitespace-pre-wrap">{formatDisplayText(item.got)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {resultMode === 'submit' && submitResult ? (
                  <div className="space-y-3">
                    {verdict ? (
                      <div className="rounded-lg border border-surface-border bg-surface-raised p-4">
                        <p className={`text-xl font-bold ${verdict.color}`}>{verdict.icon} {verdict.label}</p>
                      </div>
                    ) : null}

                    {(submitResult.test_results || []).map((item) => (
                      <div key={`submit-${item.case_number}`} className="rounded-lg border border-surface-border bg-surface-raised p-3 text-sm">
                        <p>Test Case {item.case_number}: {item.passed ? '✓ Passed' : '✗ Failed'}</p>
                        {item.is_hidden ? null : (
                          <div className="mt-2 space-y-1 text-xs">
                            <div>
                              <p className="text-surface-muted">Input:</p>
                              <p className="font-mono whitespace-pre-wrap">{formatDisplayText(item.input)}</p>
                            </div>
                            <div>
                              <p className="text-surface-muted">Expected:</p>
                              <p className="font-mono whitespace-pre-wrap">{formatDisplayText(item.expected)}</p>
                            </div>
                            <div>
                              <p className="text-surface-muted">Got:</p>
                              <p className="font-mono whitespace-pre-wrap">{formatDisplayText(item.got)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                {!resultMode ? (
                  <p className="text-sm text-surface-muted">Run sample tests or submit your solution to see results.</p>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
