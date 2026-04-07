import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import NotFound from './pages/NotFound/NotFound'
import DocsLayout from './layouts/DocsLayout'
import DocPage from './components/DocPage'

import './index.css'
const router = createBrowserRouter([
  {
    path: '/',
    element: <DocsLayout />,
    children: [
      { index: true, element: <DocPage slug="start/overview" /> },
      { path: '*', element: <DocPage /> },
    ],
  },
  {
    path: '/docs',
    element: <DocsLayout />,
    children: [
      { index: true, element: <DocPage slug="start/overview" /> },
      { path: '*', element: <DocPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
