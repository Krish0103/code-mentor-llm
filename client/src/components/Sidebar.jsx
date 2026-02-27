import { Clock, Trash2, History, ChevronLeft, MessageSquare } from 'lucide-react'

function Sidebar({ isOpen, onToggle, history, onSelectHistory, onClearHistory }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-72 bg-dark-surface border-r border-dark-border
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-slate-200">History</h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-card rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Clock className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No history yet</p>
                <p className="text-xs mt-1">Your queries will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onSelectHistory(entry)}
                    className="w-full text-left p-3 rounded-lg hover:bg-dark-card transition-colors group border border-transparent hover:border-primary-500/30"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate group-hover:text-white">
                          {entry.problem?.slice(0, 60) || entry.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                          {entry.result && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                              Saved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-4 border-t border-dark-border">
              <button
                onClick={onClearHistory}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear History
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
