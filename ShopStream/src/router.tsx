import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './page/Login'
import Dashboard from './page/Dashboard'
import React from 'react'

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
