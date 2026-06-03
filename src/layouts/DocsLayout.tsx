import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Search from '../components/Search'
import { useEffect } from 'react'

export default function DocsLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="docs-shell">
      <header className="docs-mobile-header">
        <div className="mobile-brand">Seamless Auth Docs</div>
        <Search compact />
      </header>

      <aside className="docs-sidebar">
        <div className="brand-block">
          <div className="brand-kicker">Documentation</div>
          <div className="brand">Seamless Auth</div>
          <p className="brand-copy">Docs for the auth API, SDKs, CLI, and admin dashboard.</p>
        </div>
        <Search />
        <Sidebar />
      </aside>

      <main className="docs-main">
        <Outlet />
      </main>

      <aside className="docs-meta">
        <div className="meta-section">
          <div className="meta-title">Start Here</div>
          <a href="/docs/start/overview">What is Seamless Auth?</a>
          <a href="/docs/build/ecosystem">Ecosystem Overview</a>
          <a href="/docs/reference/auth-api-routes">Auth API Routes</a>
          <a href="/docs/reference/environment-variables">Environment Variables</a>
        </div>

        <div className="meta-section">
          <div className="meta-title">Ecosystem</div>
          <a href="https://github.com/fells-code/seamless-cli" target="_blank" rel="noreferrer">
            CLI
          </a>
          <a
            href="https://github.com/fells-code/seamless-auth-api"
            target="_blank"
            rel="noreferrer"
          >
            Auth API
          </a>
          <a
            href="https://github.com/fells-code/seamless-auth-server"
            target="_blank"
            rel="noreferrer"
          >
            Server SDKs
          </a>
          <a
            href="https://github.com/fells-code/seamless-auth-react"
            target="_blank"
            rel="noreferrer"
          >
            React SDK
          </a>
          <a
            href="https://github.com/fells-code/seamless-auth-admin-dashboard"
            target="_blank"
            rel="noreferrer"
          >
            Admin Dashboard
          </a>
        </div>
      </aside>
    </div>
  )
}
