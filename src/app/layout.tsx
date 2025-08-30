import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dokumentu Menedžmenta Sistēma',
  description: 'Profesionāla dokumentu pārvaldības platforma',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="lv">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}