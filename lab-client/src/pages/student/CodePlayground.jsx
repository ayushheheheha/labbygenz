import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { runCodePlaygroundApi } from '../../api/ide.api'

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

const STARTER_CODE = {
  python: 'import sys\n\n# Read input from stdin\ndata = sys.stdin.read()\nprint(data.strip())\n',
  java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        StringBuilder input = new StringBuilder();\n        while (sc.hasNextLine()) {\n            input.append(sc.nextLine());\n            if (sc.hasNextLine()) input.append("\\n");\n        }\n        System.out.println(input.toString().trim());\n    }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    string input, line;\n    while (getline(cin, line)) {\n        if (!input.empty()) input += "\\n";\n        input += line;\n    }\n\n    cout << input;\n    return 0;\n}\n',
}

function toMonacoLanguage(language) {
  if (language === 'cpp') return 'cpp'
  return language
}

export default function CodePlayground() {
  const editorRef = useRef(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(STARTER_CODE.python)
  const [stdin, setStdin] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    // Defensive reset in case any previous page left temporary drag cursor styles.
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  const outputText = useMemo(() => {
    if (!result) return 'Run your code to see output.'

    const stdout = String(result.stdout || '')
    const stderr = String(result.stderr || '')
    const exitCode = Number(result.exit_code ?? 1)

    if (stderr && stdout) {
      return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`
    }

    if (stderr) return stderr
    if (stdout) return stdout
    if (exitCode !== 0) return `Execution failed with exit code ${exitCode}. No error text was returned by the runtime.`
    return '(no output)'
  }, [result])

  const onLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)
    setCode((prev) => {
      const currentStarter = STARTER_CODE[language] || ''
      if (prev.trim() === currentStarter.trim()) {
        return STARTER_CODE[nextLanguage] || ''
      }

      return prev
    })
  }

  const onRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setRunning(true)
    try {
      const { data } = await runCodePlaygroundApi({
        language,
        code,
        stdin,
      })
      setResult(data)
      if (Number(data?.exit_code ?? 1) === 0) {
        toast.success('Execution finished')
      } else {
        toast.error('Execution finished with errors')
      }
    } catch (error) {
      const msg = error?.response?.data?.message || 'Unable to run code'
      toast.error(msg)
    } finally {
      setRunning(false)
    }
  }

  const onReset = () => {
    setCode(STARTER_CODE[language] || '')
    setStdin('')
    setResult(null)
  }

  const onEditorMount = (editor) => {
    editorRef.current = editor
    editor.focus()
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Code Playground</h1>
            <p className="mt-1 text-sm text-surface-muted">
              Practice coding with your own input. Choose language, write code, and run.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-surface-muted" htmlFor="playground-language">Language</label>
            <select
              id="playground-language"
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              className="rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2 text-sm"
            >
              {LANGUAGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[62%_38%]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <p className="text-sm font-semibold">Code Editor</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={onReset}>Reset</Button>
              <Button size="sm" loading={running} onClick={onRun}>Run Code</Button>
            </div>
          </div>

          <div className="h-[520px]">
            <Editor
              language={toMonacoLanguage(language)}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={onEditorMount}
              theme="vs-dark"
              height="100%"
              options={{
                minimap: { enabled: false },
                fontFamily: 'Consolas, "Courier New", monospace',
                fontSize: 14,
                fontLigatures: false,
                disableMonospaceOptimizations: true,
                lineHeight: 22,
                automaticLayout: true,
                cursorStyle: 'line',
                cursorBlinking: 'solid',
                cursorSmoothCaretAnimation: 'off',
                renderLineHighlight: 'line',
                scrollBeyondLastLine: false,
                smoothScrolling: false,
                experimentalGpuAcceleration: 'off',
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  alwaysConsumeMouseWheel: false,
                },
              }}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-sm font-semibold">Input</p>
            <textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              placeholder="Provide stdin input here..."
              className="min-h-[170px] w-full rounded-xl border border-surface-border bg-[#0d1117] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Output</p>
              {result ? <Badge variant={Number(result.exit_code) === 0 ? 'success' : 'danger'}>Exit: {result.exit_code}</Badge> : null}
            </div>

            {result?.elapsed_ms ? (
              <p className="mb-2 text-xs text-surface-muted">Execution time: {result.elapsed_ms} ms</p>
            ) : null}

            <pre className="min-h-[220px] overflow-auto rounded-xl border border-surface-border bg-[#0d1117] p-3 text-xs whitespace-pre-wrap text-slate-100">
              {outputText}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}
