import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="page-head grid-bg notfound">
      <div className="shell">
        <span className="hand">well, this is awkward</span>
        <h1 className="display page-head__title">404</h1>
        <p className="page-head__lede">That page doesn’t exist — or it did and I moved it.</p>
        <Link to="/" className="btn">
          Back home
        </Link>
      </div>
    </section>
  )
}
