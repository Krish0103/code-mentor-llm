import { Menu, Code2, Sparkles } from 'lucide-react'

function Header({ onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-400 hover:text-white hover:bg-dark-card rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  CodeMentor LLM
                </h1>
                <p className="text-xs text-slate-500">Interview + DSA Trainer</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-card rounded-full border border-dark-border">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-slate-400">Powered by RAG + Ollama</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
