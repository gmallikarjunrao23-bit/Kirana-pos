import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Kirana POS',
  description: 'Smart Billing for Kirana Shops',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: {
              style: { background: '#166534', color: '#fff' },
              iconTheme: { primary: '#4ade80', secondary: '#166534' },
            },
            error: {
              style: { background: '#991b1b', color: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
