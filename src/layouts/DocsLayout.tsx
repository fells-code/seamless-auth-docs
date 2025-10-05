import { Outlet, NavLink, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Search from '../components/Search'
import { useEffect } from 'react'

export default function DocsLayout() {
  const { pathname } = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">SeamlessAuth</div>
        <Search />
        <Sidebar />
      </aside>
      <main className="content">
        <header className="topbar">
          <nav>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/docs">Docs</NavLink>
            <a href="https://dashboard.seamlessauth.com" target="_blank" rel="noreferrer">
              Dashboard
            </a>
          </nav>
          <ThemeToggle />
        </header>
        <article className="doc">
          <Outlet />
        </article>
      </main>
    </div>
  )
}

function ThemeToggle() {
  return (
    <button
      className="theme-toggle"
      onClick={() => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.theme = next
        localStorage.setItem('theme', next)
      }}
    >
      🌓
    </button>
  )
}
