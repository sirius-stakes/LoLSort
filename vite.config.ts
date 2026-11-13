import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { patchNotesApiPlugin } from './server/patchNotesApi.ts'

const SITE_URL_TOKEN = '%SITE_URL%'

/**
 * index.html の OGP / canonical 用プレースホルダーを解決する。
 * - `VITE_SITE_URL` が設定されていればそれを優先
 * - Vercel では本番ドメイン（VERCEL_PROJECT_PRODUCTION_URL）または
 *   デプロイ URL（VERCEL_URL）から自動で絶対 URL を組み立てる
 * - どちらもないローカル環境では空文字にして相対パスのまま出力する
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'rift-effects:site-url',
    transformIndexHtml(html) {
      return html.replaceAll(SITE_URL_TOKEN, siteUrl)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configured = env.VITE_SITE_URL?.trim()
  const vercelUrl =
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim()
  const siteUrl = (
    configured || (vercelUrl ? `https://${vercelUrl}` : '')
  ).replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      patchNotesApiPlugin(),
      siteUrlPlugin(siteUrl),
    ],
    server: {
      host: true,
      port: 5173,
    },
  }
})
