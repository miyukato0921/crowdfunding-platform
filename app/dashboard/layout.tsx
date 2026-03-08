import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import AdminSidebar from '@/components/admin-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar username={session.username} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
