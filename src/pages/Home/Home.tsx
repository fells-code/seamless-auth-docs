import { Link } from 'react-router-dom'
export default function Home() {
  return (
    <div className="home">
      <h1>SeamlessAuth Documentation</h1>
      <p>Modern, passwordless authentication you can ship confidently.</p>
      <div className="cta">
        <Link to="/docs">Read the docs →</Link>
        <a href="https://seamlessauth.com" target="_blank" rel="noreferrer">
          Website
        </a>
        <a href="https://dashboard.seamlessauth.com" target="_blank" rel="noreferrer">
          Dashboard
        </a>
      </div>
    </div>
  )
}
