import { NavLink } from 'react-router-dom'
import { DOCS_BY_SECTION, DOC_SECTIONS } from '../content'
import { useState } from 'react'

export default function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    start: true,
    build: true,
    understand: true,
    operate: true,
    troubleshooting: true,
    reference: false,
  })

  return (
    <div className="sidebar">
      <div className="sidebar-intro">
        <div className="sidebar-intro-title">Find your path</div>
        <div className="sidebar-intro-links">
          <NavLink to="/docs/start/overview">Overview</NavLink>
          <NavLink to="/docs/build/ecosystem">Packages</NavLink>
          <NavLink to="/docs/reference/auth-api-routes">Reference</NavLink>
        </div>
      </div>

      {Object.entries(DOCS_BY_SECTION).map(([key, docs]) => {
        if (!docs.length) return null

        const isOpen = open[key]

        return (
          <div key={key} className="sidebar-section">
            <button
              className="sidebar-section-header"
              onClick={() =>
                setOpen((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }
            >
              <span>{DOC_SECTIONS[key]}</span>
              <span className={`chevron ${isOpen ? 'open' : ''}`}>▸</span>
            </button>

            <div className={`sidebar-items ${isOpen ? 'open' : ''}`}>
              {docs.map((d) => (
                <NavLink key={d.slug} to={`/docs/${d.slug}`}>
                  {d.title}
                </NavLink>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
