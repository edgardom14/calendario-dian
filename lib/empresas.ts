import { createSupabaseBrowser } from '@/lib/supabase-browser'
import type { Empresa, EmpresaInsert } from '@/lib/types'

function client() {
  return createSupabaseBrowser()
}

export async function getEmpresas(): Promise<Empresa[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('razon_social', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertEmpresa(payload: EmpresaInsert): Promise<Empresa> {
  const supabase = client()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Debes iniciar sesión para registrar una empresa.')

  const { data, error } = await supabase
    .from('empresas')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteEmpresa(id: string): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('empresas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
