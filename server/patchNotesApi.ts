import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { getPatchNotes } from './patchNotes.ts'

const API_PATH = '/api/patch-notes'

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  cacheControl: string,
) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', cacheControl)
  response.end(JSON.stringify(payload))
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<boolean> {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  if (pathname !== API_PATH) return false

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.setHeader('Allow', 'GET, HEAD')
    response.end('Method Not Allowed')
    return true
  }

  try {
    const data = await getPatchNotes()
    response.statusCode = 200
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader(
      'Cache-Control',
      'public, max-age=900, stale-while-revalidate=3600',
    )
    response.end(request.method === 'HEAD' ? undefined : JSON.stringify(data))
  } catch (error) {
    sendJson(
      response,
      502,
      {
        error:
          error instanceof Error
            ? error.message
            : 'パッチノートの取得に失敗しました',
      },
      'no-store',
    )
  }

  return true
}

/**
 * 開発サーバー / プレビューサーバーに `/api/patch-notes` を追加する。
 * 静的ホスティング時はクライアント側の保存済みデータ + Data Dragon にフォールバックする。
 */
export function patchNotesApiPlugin(): Plugin {
  const middleware = (
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    void handleRequest(request, response)
      .then((handled) => {
        if (!handled) next()
      })
      .catch(next)
  }

  return {
    name: 'rift-effects:patch-notes-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
