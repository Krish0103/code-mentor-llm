import { useState, useEffect } from 'react'
import Header from './components/Header'
import ProblemInput from './components/ProblemInput'
import AnalysisResult from './components/AnalysisResult'
import Sidebar from './components/Sidebar'
import StatusIndicator from './components/StatusIndicator'
import { analyzeProgram } from './services/api'

function App() {
  const [problem, setProblem] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [serverStatus, setServerStatus] = useState('checking')
  const [history, setHistory] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Check server health on mount
  useEffect(() => {
    checkServerHealth()
    loadHistory()
  }, [])

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/health')
      if (res.ok) {
        setServerStatus('healthy')
      } else {
        setServerStatus('error')
      }
    } catch {
      setServerStatus('error')
    }
  }

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('codementor-history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      console.error('Failed to load history')
    }
  }

  const saveToHistory = (problem, result) => {
    const newEntry = {
      id: Date.now(),
      problem: problem,
      result: result,
      timestamp: new Date().toISOString(),
      title: result?.structured_response?.understanding?.split('\n')[0]?.slice(0, 50) || problem.slice(0, 50)
    }
    const updated = [newEntry, ...history.slice(0, 19)]
    setHistory(updated)
    localStorage.setItem('codementor-history', JSON.stringify(updated))
  }

  const handleSubmit = async () => {
    if (!problem.trim() || problem.length < 10) {
      setError('Please enter a problem description (at least 10 characters)')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeProgram(problem)
      setResult(data)
      saveToHistory(problem, data)
    } catch (err) {
      setError(err.message || 'Failed to analyze problem. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleHistorySelect = (entry) => {
    setProblem(entry.problem)
    setResult(entry.result)
    setError(null)
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem('codementor-history')
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        history={history}
        onSelectHistory={handleHistorySelect}
        onClearHistory={handleClearHistory}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Indicator */}
          <StatusIndicator status={serverStatus} onRefresh={checkServerHealth} />

          {/* Problem Input */}
          <ProblemInput
            value={problem}
            onChange={setProblem}
            onSubmit={handleSubmit}
            loading={loading}
            disabled={serverStatus !== 'healthy'}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fade-in">
              <p className="text-red-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-8 animate-fade-in">
              <div className="bg-dark-card border border-dark-border rounded-xl p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-300 text-lg">
                    Analyzing your problem<span className="loading-dots"></span>
                  </p>
                  <p className="text-slate-500 text-sm">
                    This may take 30-60 seconds for complex problems
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <AnalysisResult result={result} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-border py-6 mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-slate-500 text-sm">
              CodeMentor LLM • Powered by Ollama + RAG • Built for DSA Interview Preparation
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
