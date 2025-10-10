import { NavLink } from 'react-router-dom'
import { DOCS } from '../content'

export default function Sidebar() {
  return (
    <ul className="sidebar-list">
      {DOCS.map((d) => {
        return (
          <li key={d.slug}>
            <NavLink to={`/docs/${d.slug}`}>{d.title}</NavLink>
          </li>
        )
      })}
    </ul>
  )
}
