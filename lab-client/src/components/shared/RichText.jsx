import { Fragment } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import CodeBlock from './CodeBlock'

function normalizeEscapedNewlines(value) {
  return String(value || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

function isHtmlContent(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function sanitizeHtml(value) {
  // Basic guard for obviously unsafe tags in admin-authored content.
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
}

function parseInline(text, keyPrefix) {
  const result = []
  let index = 0
  let remaining = text

  const inlineMathRegex = /(\$[^$\n]+\$)/
  const inlineCodeRegex = /(`[^`\n]+`)/

  while (remaining.length > 0) {
    const mathMatch = remaining.match(inlineMathRegex)
    const codeMatch = remaining.match(inlineCodeRegex)

    let match = null
    let type = null

    if (mathMatch && codeMatch) {
      if (mathMatch.index <= codeMatch.index) {
        match = mathMatch
        type = 'math'
      } else {
        match = codeMatch
        type = 'code'
      }
    } else if (mathMatch) {
      match = mathMatch
      type = 'math'
    } else if (codeMatch) {
      match = codeMatch
      type = 'code'
    }

    if (!match) {
      result.push(
        <span key={`${keyPrefix}-text-${index}`}>{remaining}</span>,
      )
      break
    }

    if (match.index > 0) {
      result.push(
        <span key={`${keyPrefix}-text-${index}`}>{remaining.slice(0, match.index)}</span>,
      )
      index += 1
    }

    const raw = match[0]
    if (type === 'math') {
      result.push(
        <InlineMath key={`${keyPrefix}-math-${index}`} math={raw.slice(1, -1)} />,
      )
    } else {
      result.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-black/35 px-1.5 py-0.5 font-mono text-sm text-brand-light"
        >
          {raw.slice(1, -1)}
        </code>,
      )
    }

    index += 1
    remaining = remaining.slice(match.index + raw.length)
  }

  return result
}

export default function RichText({ content = '' }) {
  const normalizedContent = normalizeEscapedNewlines(content)

  if (isHtmlContent(normalizedContent)) {
    return (
      <div
        className="space-y-3 leading-7 text-slate-200"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalizedContent) }}
      />
    )
  }

  const blocks = []
  const blockMathRegex = /(\$\$[\s\S]*?\$\$)/g
  const parts = normalizedContent.split(blockMathRegex)

  parts.forEach((part, partIndex) => {
    if (!part) return

    if (part.startsWith('$$') && part.endsWith('$$')) {
      blocks.push(
        <div key={`block-math-${partIndex}`} className="my-4 overflow-x-auto">
          <BlockMath math={part.slice(2, -2)} />
        </div>,
      )
      return
    }

    const codeSegments = part.split(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g)

    for (let i = 0; i < codeSegments.length; i += 1) {
      const plain = codeSegments[i]
      if (plain) {
        blocks.push(
          <Fragment key={`plain-${partIndex}-${i}`}>
            {parseInline(plain, `inline-${partIndex}-${i}`)}
          </Fragment>,
        )
      }

      const language = codeSegments[i + 1]
      const code = codeSegments[i + 2]
      if (typeof language === 'string' && typeof code === 'string') {
        blocks.push(
          <CodeBlock
            key={`code-${partIndex}-${i}`}
            language={language || 'plaintext'}
            code={code.trimEnd()}
          />,
        )
        i += 2
      }
    }
  })

  return <div className="space-y-3 leading-7 text-slate-200">{blocks}</div>
}
