import { ReactNode } from 'react'

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="doc-card">
      {title && <div className="doc-card-title">{title}</div>}
      <div className="doc-card-content">{children}</div>
    </div>
  )
}
