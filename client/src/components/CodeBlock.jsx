import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'

function CodeBlock({ code, language = 'python' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Clean up code - remove excessive whitespace
  const cleanCode = code?.trim() || ''

  // Detect language from code if not specified
  const detectLanguage = (code) => {
    if (code.includes('def ') || code.includes('import ') && code.includes(':')) return 'python'
    if (code.includes('function ') || code.includes('const ') || code.includes('=>')) return 'javascript'
    if (code.includes('public class') || code.includes('System.out')) return 'java'
    if (code.includes('#include') || code.includes('int main')) return 'cpp'
    return language
  }

  const detectedLang = detectLanguage(cleanCode)

  return (
    <div className="relative group rounded-lg overflow-hidden">
      {/* Language badge and copy button */}
      <div className="absolute top-0 right-0 flex items-center gap-2 p-2 z-10">
        <span className="px-2 py-0.5 text-xs font-medium bg-dark-surface/80 text-slate-400 rounded">
          {detectedLang}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 bg-dark-surface/80 hover:bg-dark-card text-slate-400 hover:text-white rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Code highlighter */}
      <SyntaxHighlighter
        language={detectedLang}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          paddingTop: '2.5rem',
          background: '#1a1b26',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.7',
        }}
        showLineNumbers
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: '#4a5568',
          userSelect: 'none',
        }}
        wrapLongLines
      >
        {cleanCode}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeBlock
