import { ReactNode } from 'react'
import { Lightbulb, AlertTriangle, Info, CheckCircle } from 'lucide-react'

type CalloutType = 'tip' | 'warning' | 'info' | 'success'

const ICONS = {
  tip: Lightbulb,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

export function Callout({ type = 'info', children }: { type?: CalloutType; children: ReactNode }) {
  const Icon = ICONS[type]

  return (
    <div className={`callout callout-${type}`}>
      <div className="callout-icon">
        <Icon size={18} />
      </div>
      <div className="callout-content">{children}</div>
    </div>
  )
}
