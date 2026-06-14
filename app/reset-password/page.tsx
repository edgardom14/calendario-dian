import { Suspense } from 'react'
import ResetPasswordForm from '@/components/ResetPasswordForm'

export const metadata = { title: 'Nueva contraseña – CalendarioDIAN' }

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
