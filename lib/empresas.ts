import { supabase } from '@/lib/supabase'
import type { Empresa, EmpresaInsert } from '@/lib/types'

export async function getEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('razon_social', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertEmpresa(payload: EmpresaInsert): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteEmpresa(id: string): Promise<void> {
  const { error } = await supabase.from('empresas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
