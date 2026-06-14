import { Resend } from 'resend'

// Falla en tiempo de arranque si la variable no está definida, para detectar
// errores de configuración antes del primer envío real.
if (!process.env.RESEND_API_KEY) {
  throw new Error(
    'Falta RESEND_API_KEY. Agrégala a .env.local (ver comentarios en ese archivo).'
  )
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
