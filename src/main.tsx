import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/react'
import { BrowserRouter, Route, Routes } from 'react-router'

import Layout from './components/layouts/Layout.tsx'
import DealsPage from './pages/Deals.tsx'
import CategoriesPage from './pages/Categories.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path='/' element={<App />} />
            <Route path='/categories' element={<CategoriesPage />} />
            <Route path='/deals' element={<DealsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
