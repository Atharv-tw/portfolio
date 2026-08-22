import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'

/** Every route change starts at the top — the browser would otherwise keep the old offset. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  // The playground owns the full viewport and manages its own scrolling.
  const bare = pathname === '/playground'

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <ScrollToTop />
      <Nav />
      <main id="main">
        <Outlet />
      </main>
      {!bare && <Footer />}
    </>
  )
}
