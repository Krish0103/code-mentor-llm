import { CheckCircle, AlertCircle, RefreshCcw, Wifi, WifiOff } from 'lucide-react'

function StatusIndicator({ status, onRefresh }) {
  const statusConfig = {
    checking: {
      icon: <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />,
      text: 'Checking server...',
      className: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    },
    healthy: {
      icon: <Wifi className="w-4 h-4 text-green-400" />,
      text: 'Server connected',
      className: 'text-green-400 bg-green-500/10 border-green-500/30',
    },
    error: {
      icon: <WifiOff className="w-4 h-4 text-red-400" />,
      text: 'Server unavailable',
      className: 'text-red-400 bg-red-500/10 border-red-500/30',
    },
  }

  const config = statusConfig[status] || statusConfig.checking

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm mb-6 ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
      {status !== 'checking' && (
        <button
          onClick={onRefresh}
          className="ml-1 p-1 hover:bg-white/10 rounded-full transition-colors"
          title="Refresh status"
        >
          <RefreshCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default StatusIndicator
