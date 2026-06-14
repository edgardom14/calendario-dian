/**
 * Genera icon-192.png e icon-512.png para la PWA.
 * Uso: node scripts/generate-icons.mjs
 * Requiere: npm install -D sharp
 */

import sharp from 'sharp'
import { writeFileSync } from 'fs'

const SIZES = [192, 512]

// SVG del ícono: calendario con fondo azul oscuro y check
function buildSvg(size) {
  const pad  = Math.round(size * 0.12)
  const r    = Math.round(size * 0.22)  // border-radius
  const icon = size - pad * 2

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#0f172a"/>

  <!-- Círculo azul central -->
  <circle cx="${size/2}" cy="${size/2}" r="${Math.round(icon*0.42)}" fill="#1e3a5f"/>

  <!-- Icono de calendario (simplificado) -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Cuerpo del calendario -->
    <rect x="${-icon*0.28}" y="${-icon*0.20}" width="${icon*0.56}" height="${icon*0.46}"
          rx="${icon*0.06}" fill="none" stroke="#3b82f6" stroke-width="${icon*0.06}"/>
    <!-- Línea superior del calendario -->
    <line x1="${-icon*0.28}" y1="${-icon*0.05}" x2="${icon*0.28}" y2="${-icon*0.05}"
          stroke="#3b82f6" stroke-width="${icon*0.05}"/>
    <!-- Anillos del calendario -->
    <line x1="${-icon*0.10}" y1="${-icon*0.26}" x2="${-icon*0.10}" y2="${-icon*0.10}"
          stroke="#60a5fa" stroke-width="${icon*0.06}" stroke-linecap="round"/>
    <line x1="${icon*0.10}" y1="${-icon*0.26}" x2="${icon*0.10}" y2="${-icon*0.10}"
          stroke="#60a5fa" stroke-width="${icon*0.06}" stroke-linecap="round"/>
    <!-- Check dentro del calendario -->
    <polyline points="${-icon*0.12},${icon*0.04} ${-icon*0.02},${icon*0.14} ${icon*0.14},${-icon*0.04}"
              fill="none" stroke="#34d399" stroke-width="${icon*0.07}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`.trim()
}

for (const size of SIZES) {
  const svg    = buildSvg(size)
  const buffer = Buffer.from(svg)

  await sharp(buffer)
    .png()
    .toFile(`public/icon-${size}.png`)

  console.log(`✅  public/icon-${size}.png generado`)
}

console.log('\n🎉  Iconos PWA listos. Haz commit y push para que Vercel los sirva.')
