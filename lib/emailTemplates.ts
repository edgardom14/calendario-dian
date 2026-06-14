import { formatearFecha } from '@/lib/dianLogic'

export interface AlertaData {
  razonSocial: string
  nit: string
  digitoVerificacion: number
  impuesto: string
  periodo: string | null
  fechaVencimiento: string   // "YYYY-MM-DD"
  diasRestantes: number
}

// ─── Colores y etiquetas según urgencia ───────────────────────────────────────
function urgenciaStyles(dias: number): { color: string; etiqueta: string; icono: string } {
  if (dias <= 1) return { color: '#ef4444', etiqueta: '🚨 URGENTE – Vence mañana',   icono: '🚨' }
  if (dias <= 5) return { color: '#f97316', etiqueta: '⚠️ ALERTA – Vence en 5 días', icono: '⚠️' }
  return              { color: '#3b82f6', etiqueta: 'Recordatorio de vencimiento',   icono: '📅' }
}

// ─── Template HTML ────────────────────────────────────────────────────────────
export function buildAlertaHtml(data: AlertaData): string {
  const { color, etiqueta, icono } = urgenciaStyles(data.diasRestantes)
  const fechaFormateada = formatearFecha(data.fechaVencimiento)
  const periodoStr = data.periodo ? ` – ${data.periodo}` : ''
  const diasStr =
    data.diasRestantes === 1
      ? 'Vence <strong>mañana</strong>'
      : `Vence en <strong>${data.diasRestantes} días</strong>`

  return /* html */ `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alerta de Vencimiento DIAN</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1e293b;border-radius:16px 16px 0 0;padding:28px 32px;border-bottom:1px solid #334155;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">
                      📅 CalendarioDIAN
                    </span>
                    <br/>
                    <span style="font-size:12px;color:#64748b;margin-top:2px;display:block;">
                      Sistema de Alertas Tributarias
                    </span>
                  </td>
                  <td align="right">
                    <span style="background:${color}22;color:${color};border:1px solid ${color}44;
                                 border-radius:20px;padding:5px 14px;font-size:11px;font-weight:600;">
                      ${etiqueta}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="background:#1e293b;padding:32px;">

              <!-- Saludo -->
              <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;">
                Estimado equipo contable,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#cbd5e1;line-height:1.6;">
                Le informamos que la siguiente obligación tributaria ante la
                <strong style="color:#f8fafc;">DIAN</strong> está próxima a vencer.
                Por favor, tome las medidas necesarias para evitar sanciones.
              </p>

              <!-- Tarjeta de alerta -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#0f172a;border:1px solid ${color}44;
                            border-left:4px solid ${color};border-radius:12px;
                            margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">

                    <!-- Impuesto -->
                    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f8fafc;">
                      ${icono} ${data.impuesto}${periodoStr}
                    </p>

                    <!-- Detalles en grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;width:50%;vertical-align:top;">
                          <span style="font-size:11px;color:#64748b;text-transform:uppercase;
                                       letter-spacing:0.8px;display:block;margin-bottom:3px;">
                            Empresa
                          </span>
                          <span style="font-size:14px;color:#e2e8f0;font-weight:600;">
                            ${data.razonSocial}
                          </span>
                        </td>
                        <td style="padding:6px 0;width:50%;vertical-align:top;">
                          <span style="font-size:11px;color:#64748b;text-transform:uppercase;
                                       letter-spacing:0.8px;display:block;margin-bottom:3px;">
                            NIT
                          </span>
                          <span style="font-size:14px;color:#e2e8f0;font-family:monospace;">
                            ${data.nit}-${data.digitoVerificacion}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;">
                          <span style="font-size:11px;color:#64748b;text-transform:uppercase;
                                       letter-spacing:0.8px;display:block;margin-bottom:3px;">
                            Fecha de vencimiento
                          </span>
                          <span style="font-size:20px;color:${color};font-weight:700;">
                            ${fechaFormateada}
                          </span>
                        </td>
                        <td style="padding:6px 0;vertical-align:top;">
                          <span style="font-size:11px;color:#64748b;text-transform:uppercase;
                                       letter-spacing:0.8px;display:block;margin-bottom:3px;">
                            Tiempo restante
                          </span>
                          <span style="font-size:14px;color:#e2e8f0;">
                            ${diasStr}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Advertencia legal -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#422006;border:1px solid #78350f;border-radius:10px;
                            margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#fcd34d;line-height:1.6;">
                      <strong>⚠️ Recuerda:</strong> El incumplimiento de esta obligación puede
                      generar intereses moratorios y sanciones establecidas en el
                      Estatuto Tributario colombiano. Presenta y paga a tiempo.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background:#3b82f6;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard"
                       style="display:inline-block;padding:13px 28px;font-size:14px;
                              font-weight:600;color:#ffffff;text-decoration:none;
                              border-radius:10px;">
                      Ver Dashboard de Obligaciones →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 32px;
                       border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;font-size:11px;color:#475569;line-height:1.6;">
                Este correo fue generado automáticamente por
                <strong style="color:#64748b;">CalendarioDIAN</strong>.
                <br/>Si no deseas recibir estas alertas, actualiza las preferencias de tu empresa.
                <br/><br/>
                © ${new Date().getFullYear()} CalendarioDIAN · Plataforma de vencimientos fiscales Colombia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()
}

// ─── Asunto del correo ────────────────────────────────────────────────────────
export function buildAlertaSubject(data: AlertaData): string {
  const prefix = data.diasRestantes <= 1 ? '🚨 URGENTE' : '⚠️ Alerta'
  return `${prefix}: ${data.impuesto} de ${data.razonSocial} vence el ${formatearFecha(data.fechaVencimiento)}`
}
