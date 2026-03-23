import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grepr - Under Maintenance',
  description: 'Grepr is currently under maintenance. We\'ll be back shortly.',
  robots: { index: false, follow: false },
}

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
