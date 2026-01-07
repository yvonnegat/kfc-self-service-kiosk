import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KFC Self-Ordering Kiosk',
  description: 'Fast and easy self-service ordering system for KFC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}