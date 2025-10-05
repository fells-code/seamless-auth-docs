import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home/Home'
import NotFound from './pages/NotFound/NotFound'
import DocsLayout from './layouts/DocsLayout'
import DocPage from './components/DocPage'

import './styles/global.css'
const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  {
    path: '/docs',
    element: <DocsLayout />, // shared chrome (sidebar/topbar)
    children: [
      { index: true, element: <DocPage slug="introduction" /> },
      { path: ':slug', element: <DocPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
