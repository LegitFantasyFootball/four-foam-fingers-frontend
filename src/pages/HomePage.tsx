import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Four Foam Fingers</h1>
      <p style={{ color: 'var(--fff-muted)', marginBottom: 16 }}>
        Pick your game and jump in.
      </p>

      <button
        style={{ width: '100%', padding: '14px 16px', fontSize: 16 }}
        onClick={() => navigate('/march-basketball-foam-fingers')}
      >
        Enter Foam Fingers Game
      </button>
    </div>
  )
}