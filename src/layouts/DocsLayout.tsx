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
      <aside className="docs-sidebar">
        <div className="brand">Seamless Auth</div>
        <Search />
        <Sidebar />
      </aside>

      <main className="docs-main">
        <Outlet />
      </main>

      <aside className="docs-meta">
        <div className="meta-section">
          <div className="meta-title">Resources</div>
          <a href="https://seamlessauth.com/blog" target="_blank" rel="noreferrer">
            Blog
          </a>
          <a
            href="https://github.com/fells-code/seamless-auth-api"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://github.com/fells-code/seamless-auth-api/releases"
            target="_blank"
            rel="noreferrer"
          >
            Releases
          </a>
        </div>
      </aside>
    </div>
  )
}
