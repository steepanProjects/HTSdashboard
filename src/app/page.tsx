import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: 'var(--space-4) var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              ◈
            </div>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.01em',
            }}>
              Hackathon Monitor
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link 
              href="/admin" 
              className="btn btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              Admin
            </Link>
            <Link 
              href="/monitor" 
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Monitor
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
      }}>
        <div style={{ 
          maxWidth: '800px', 
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-accent-subtle)',
            border: '1px solid var(--color-accent-border)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-6)',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: 'var(--color-accent)',
              borderRadius: '50%',
            }} />
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-accent)',
            }}>
              AI-Powered Monitoring
            </span>
          </div>

          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-6)',
            color: 'var(--color-text-primary)',
          }}>
            Track Developer Progress
            <br />
            <span style={{ color: 'var(--color-text-secondary)' }}>
              in Real-Time
            </span>
          </h1>

          <p style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto var(--space-8)',
          }}>
            Monitor hackathon participants with AI-driven screenshot analysis. 
            Track productivity, detect AI dependency, and visualize team progress 
            through an intelligent dashboard.
          </p>

          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-4)', 
            justifyContent: 'center',
            marginBottom: 'var(--space-12)',
          }}>
            <Link 
              href="/monitor" 
              className="btn btn-primary"
              style={{ 
                textDecoration: 'none', 
                padding: 'var(--space-4) var(--space-6)',
                fontSize: '15px',
              }}
            >
              View Live Monitor
            </Link>
            <Link 
              href="/admin" 
              className="btn btn-secondary"
              style={{ 
                textDecoration: 'none', 
                padding: 'var(--space-4) var(--space-6)',
                fontSize: '15px',
              }}
            >
              Manage Teams
            </Link>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-6)',
            textAlign: 'left',
          }}>
            {[
              {
                icon: '●',
                title: 'Real-Time Analysis',
                desc: 'Instant screenshot processing with AI vision models',
              },
              {
                icon: '◆',
                title: 'Dual-Model Scoring',
                desc: 'GPT-4 + Llama-3 cross-validation for accuracy',
              },
              {
                icon: '▲',
                title: 'AI Dependency Detection',
                desc: 'Smart detection of excessive AI code generation',
              },
            ].map((feature, i) => (
              <div 
                key={i}
                style={{
                  padding: 'var(--space-6)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: 'var(--color-accent)',
                  marginBottom: 'var(--space-4)',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-text-tertiary)',
                  lineHeight: 1.5,
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: 'var(--space-12) var(--space-6)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: 'var(--space-8)',
            color: 'var(--color-text-primary)',
          }}>
            API Endpoints
          </h2>

          <div style={{
            display: 'grid',
            gap: 'var(--space-4)',
          }}>
            {[
              { method: 'POST', path: '/api/ingest', desc: 'Receive screenshots from Electron apps' },
              { method: 'GET', path: '/api/status', desc: 'Check queue processing status' },
              { method: 'GET', path: '/api/monitor/analyses', desc: 'Get real-time image analyses' },
              { method: 'GET', path: '/api/monitor/progress', desc: 'Get batch progress summaries' },
            ].map((endpoint, i) => (
              <div 
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4) var(--space-5)',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{
                  padding: 'var(--space-1) var(--space-3)',
                  background: endpoint.method === 'POST' ? 'var(--color-accent-subtle)' : 'var(--color-success-subtle)',
                  color: endpoint.method === 'POST' ? 'var(--color-accent)' : 'var(--color-success)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}>
                  {endpoint.method}
                </span>
                <code style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: 'var(--color-text-primary)',
                }}>
                  {endpoint.path}
                </code>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '13px',
                  color: 'var(--color-text-tertiary)',
                }}>
                  {endpoint.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
        }}>
          Hackathon Monitor • Built with Next.js + Groq AI
        </p>
      </footer>
    </main>
  );
}
