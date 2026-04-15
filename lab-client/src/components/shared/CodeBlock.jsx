function escapeHtml(input) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function highlightPseudo(code) {
  let html = escapeHtml(code)

  html = html.replace(/(#.*)$/gm, '<span class="kw-comment">$1</span>')
  html = html.replace(/\b(IF|ELSE|WHILE|FOR|RETURN|PRINT|if|else|while|for|return|print)\b/g, '<span class="kw-control">$1</span>')
  html = html.replace(/\b(Procedure|End|Function)\b/g, '<span class="kw-func">$1</span>')
  html = html.replace(/\b(True|False|null)\b/g, '<span class="kw-value">$1</span>')
  html = html.replace(/=/g, '<span class="kw-assign">=</span>')

  return html
}

function highlightLang(code, language) {
  const escaped = escapeHtml(code)

  if (language === 'pseudocode' || language === 'pseudo') {
    return highlightPseudo(code)
  }

  if (language === 'python') {
    return escaped
      .replace(/\b(def|class|if|elif|else|for|while|return|import|from|try|except|with|as|pass|break|continue)\b/g, '<span class="kw-control">$1</span>')
      .replace(/\b(True|False|None)\b/g, '<span class="kw-value">$1</span>')
      .replace(/(#.*)$/gm, '<span class="kw-comment">$1</span>')
  }

  if (language === 'java') {
    return escaped
      .replace(/\b(public|private|protected|class|static|void|if|else|for|while|return|new|import|package)\b/g, '<span class="kw-control">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="kw-value">$1</span>')
      .replace(/(\/\/.*)$/gm, '<span class="kw-comment">$1</span>')
  }

  return escaped
}

export default function CodeBlock({ code = '', language = 'plaintext' }) {
  const normalizedLanguage = (language || 'plaintext').toLowerCase()
  const rendered = highlightLang(code, normalizedLanguage)

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-surface-border">
      <div className="border-b border-surface-border bg-black/30 px-3 py-1.5 text-xs uppercase tracking-wide text-surface-muted">
        {normalizedLanguage}
      </div>
      <pre className="code-block">
        <code dangerouslySetInnerHTML={{ __html: rendered }} />
      </pre>
    </div>
  )
}
