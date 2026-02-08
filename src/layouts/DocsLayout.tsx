import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Search from '../components/Search'
import { useEffect } from 'react'

export default function DocsLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Seamless Auth</div>
        <Search />
        <Sidebar />
      </aside>

      <main className="content">
        <article className="doc">
          <Outlet />
        </article>
      </main>

      <aside className="meta-nav">
        <nav>
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
        </nav>
      </aside>
    </div>
  )
}
