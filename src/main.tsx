import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import '@fontsource-variable/handjet'
import '@fontsource-variable/inter'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/just-me-again-down-here'

import './styles/base.css'
import './styles/sections.css'

import App from './App'
import Home from './pages/Home'
import About from './pages/About'
import Work from './pages/Work'
import CaseStudy from './pages/CaseStudy'
import Playground from './pages/Playground'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="work" element={<Work />} />
          <Route path="work/:slug" element={<CaseStudy />} />
          <Route path="playground" element={<Playground />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
