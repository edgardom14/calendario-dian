import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PerfilClient from '@/components/PerfilClient'

export const metadata = { title: 'Mi Perfil – CalendarioDIAN' }

export default async function PerfilPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/perfil')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <PerfilClient
      email={user.email ?? ''}
      perfil={perfil ?? { id: user.id, nombre_completo: '', nombre_empresa: '', telefono: '' }}
    />
  )
}
