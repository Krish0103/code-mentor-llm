import { useState } from 'react'
import { 
  Brain, 
  Code, 
  Lightbulb, 
  Clock, 
  Target, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  AlertTriangle,
  HelpCircle,
  Layers,
  Play
} from 'lucide-react'
import CodeBlock from './CodeBlock'

function Section({ icon: Icon, title, children, defaultOpen = true, color = 'primary' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  const colorClasses = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/30',
    accent: 'text-accent-400 bg-accent-500/10 border-accent-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-surface/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 animate-fade-in">
          <div className="border-t border-dark-border pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisResult({ result }) {
  const [copied, setCopied] = useState(false)
  
  const response = result?.structured_response || result?.answer || {}
  const sources = result?.sources || []
  const metadata = result?.metadata || {}
  
  // Parse the response - it might be a string or already structured
  let displayData = response
  if (typeof response === 'string') {
    displayData = { raw: response }
  }

  const handleCopyAll = () => {
    const text = typeof response === 'string' 
      ? response 
      : JSON.stringify(response, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check if we have any content to display
  const hasContent = displayData.understanding || displayData.brute_force || 
    displayData.optimized || displayData.java_code || displayData.raw

  if (!hasContent) {
    return (
      <div className="mt-8 p-6 bg-dark-card border border-dark-border rounded-xl">
        <p className="text-slate-400 text-center">No analysis data available</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent-400" />
            Analysis Result
          </h2>
          {metadata.duration_ms && (
            <p className="text-xs text-slate-500 mt-1">
              Generated in {(metadata.duration_ms / 1000).toFixed(1)}s using {metadata.model}
            </p>
          )}
        </div>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-dark-card border border-dark-border rounded-lg hover:border-primary-500/50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy All
            </>
          )}
        </button>
      </div>

      {/* Understanding Section */}
      {displayData.understanding && (
        <Section icon={Brain} title="Problem Understanding" color="primary">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.understanding}
            </p>
          </div>
        </Section>
      )}

      {/* Brute Force Approach */}
      {displayData.brute_force && (
        <Section icon={Lightbulb} title="Brute Force Approach" color="yellow" defaultOpen={false}>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.brute_force}
            </p>
          </div>
        </Section>
      )}

      {/* Optimized Solution */}
      {displayData.optimized && (
        <Section icon={Target} title="Optimized Solution" color="green">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.optimized}
            </p>
          </div>
        </Section>
      )}

      {/* Java Code Section */}
      {displayData.java_code && (
        <Section icon={Code} title="Java Solution" color="accent" defaultOpen={true}>
          <CodeBlock code={displayData.java_code} language="java" />
        </Section>
      )}

      {/* Dry Run Section */}
      {displayData.dry_run && (
        <Section icon={Play} title="Dry Run / Walkthrough" color="blue">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.dry_run}
            </p>
          </div>
        </Section>
      )}

      {/* Time Complexity */}
      {displayData.time_complexity && (
        <Section icon={Clock} title="Time Complexity" color="purple">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.time_complexity}
            </p>
          </div>
        </Section>
      )}

      {/* Space Complexity */}
      {displayData.space_complexity && (
        <Section icon={Layers} title="Space Complexity" color="purple" defaultOpen={false}>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.space_complexity}
            </p>
          </div>
        </Section>
      )}

      {/* Edge Cases */}
      {displayData.edge_cases && displayData.edge_cases.length > 0 && (
        <Section icon={AlertTriangle} title="Edge Cases" color="red" defaultOpen={false}>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {displayData.edge_cases.map((edge, idx) => (
              <li key={idx}>{edge}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Common Mistakes */}
      {displayData.common_mistakes && displayData.common_mistakes.length > 0 && (
        <Section icon={AlertTriangle} title="Common Mistakes" color="red" defaultOpen={false}>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {displayData.common_mistakes.map((mistake, idx) => (
              <li key={idx}>{mistake}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Follow-up Questions */}
      {displayData.follow_up_questions && displayData.follow_up_questions.length > 0 && (
        <Section icon={HelpCircle} title="Follow-up Questions" color="blue" defaultOpen={false}>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {displayData.follow_up_questions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Variations */}
      {displayData.variations && displayData.variations.length > 0 && (
        <Section icon={Layers} title="Problem Variations" color="accent" defaultOpen={false}>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {displayData.variations.map((v, idx) => (
              <li key={idx}>{v}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Raw Response (fallback) */}
      {displayData.raw && (
        <Section icon={BookOpen} title="Response" color="primary">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {displayData.raw}
            </p>
          </div>
        </Section>
      )}

      {/* Sources / Retrieved Context */}
      {sources.length > 0 && (
        <Section icon={BookOpen} title={`Sources (${sources.length} documents)`} defaultOpen={false} color="accent">
          <div className="space-y-3">
            {sources.map((doc, index) => (
              <div 
                key={index}
                className="p-3 bg-dark-bg rounded-lg border border-dark-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-400">
                    {doc.title || `Document ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {doc.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        doc.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        doc.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {doc.difficulty}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      Score: {(doc.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-dark-surface rounded text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

export default AnalysisResult
