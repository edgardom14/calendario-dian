import LoginForm from '@/components/LoginForm'

export const metadata = { title: 'Ingresar – CalendarioDIAN' }

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <LoginForm />
    </main>
  )
}
