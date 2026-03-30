export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Hackathon Monitor API</h1>
      <p>System is running. Use the following endpoints:</p>
      <ul>
        <li><code>POST /api/ingest</code> - Receive data from Electron apps</li>
        <li><code>GET /api/status</code> - Check queue status</li>
        <li><code>GET /api/status?userId=USER_ID</code> - Check user batch status</li>
      </ul>
      <br />
      <p><a href="/admin" style={{ color: 'blue', textDecoration: 'underline' }}>Go to Admin Dashboard</a></p>
    </main>
  );
}
