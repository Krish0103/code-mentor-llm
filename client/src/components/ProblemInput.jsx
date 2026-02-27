import { Send, Lightbulb } from 'lucide-react'

const EXAMPLE_PROBLEMS = [
  "Find two numbers in an array that sum to a target value",
  "Reverse a linked list in place",
  "Find the longest palindromic substring in a string",
  "Implement a LRU cache with O(1) operations",
  "Find all permutations of a string",
]

function ProblemInput({ value, onChange, onSubmit, loading, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSubmit()
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Input Card */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-dark-border bg-dark-surface/50">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Describe Your DSA Problem
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter a coding problem or algorithm challenge for analysis
          </p>
        </div>

        <div className="p-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: Given an array of integers and a target sum, find two numbers that add up to the target. Return their indices..."
            className="w-full h-40 bg-dark-bg border border-dark-border rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none custom-scrollbar"
            disabled={loading || disabled}
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              Press <kbd className="px-1.5 py-0.5 bg-dark-surface rounded text-slate-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-dark-surface rounded text-slate-400">Enter</kbd> to submit
            </p>
            
            <button
              onClick={onSubmit}
              disabled={loading || disabled || !value.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:from-primary-600 hover:to-accent-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze Problem
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Example Problems */}
      {!value && !loading && (
        <div className="animate-fade-in">
          <p className="text-sm text-slate-500 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROBLEMS.map((example, index) => (
              <button
                key={index}
                onClick={() => onChange(example)}
                disabled={disabled}
                className="px-3 py-1.5 text-sm bg-dark-card border border-dark-border rounded-full text-slate-400 hover:text-white hover:border-primary-500/50 transition-colors disabled:opacity-50"
              >
                {example.length > 40 ? example.slice(0, 40) + '...' : example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProblemInput
