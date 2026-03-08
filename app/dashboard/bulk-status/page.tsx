import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BulkStatusClient from './bulk-status-client'

export default async function BulkStatusPage() {
  const session = await requireAuth()
  if (!session) redirect('/login')
  return <BulkStatusClient />
}
