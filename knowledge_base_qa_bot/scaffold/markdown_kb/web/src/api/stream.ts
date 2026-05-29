import type { Source } from '../types'

export type StreamHandlers = {
  onSources?: (sources: Source[]) => void
  onToken?: (text: string) => void
  onDone?: (finishReason: string) => void
  onError?: (message: string) => void
}

/**
 * POST to /chat/stream and parse the Server-Sent Events response.
 * EventSource only supports GET, so we read the fetch body stream manually.
 */
export async function streamChat(
  query: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response
  try {
    res = await fetch('/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal,
    })
  } catch (err) {
    if (isAbort(err)) return
    handlers.onError?.(toMessage(err, 'Could not reach the server'))
    return
  }

  if (!res.ok || !res.body) {
    handlers.onError?.(`Request failed (${res.status})`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        dispatch(frame, handlers)
      }
    }
  } catch (err) {
    if (isAbort(err)) return
    handlers.onError?.(toMessage(err, 'Stream interrupted'))
  }
}

function dispatch(frame: string, handlers: StreamHandlers): void {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
  }
  if (dataLines.length === 0) return

  let data: Record<string, unknown>
  try {
    data = JSON.parse(dataLines.join('\n'))
  } catch {
    return
  }

  switch (event) {
    case 'sources':
      handlers.onSources?.((data.sources as Source[]) ?? [])
      break
    case 'token':
      handlers.onToken?.((data.text as string) ?? '')
      break
    case 'done':
      handlers.onDone?.((data.finish_reason as string) ?? 'stop')
      break
    case 'error':
      handlers.onError?.((data.message as string) ?? 'Unknown error')
      break
  }
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}
