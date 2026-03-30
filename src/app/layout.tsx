export const metadata = {
  title: 'Hackathon Monitor',
  description: 'AI-based hackathon monitoring system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
