import { useCallback, useEffect, useRef, useState } from 'react'
import { Chip, ScrollShadow } from '@heroui/react'
import { Composer } from './components/Composer'
import { MessageTurn } from './components/MessageTurn'
import { streamChat } from './api/stream'
import type { Turn } from './types'

const EXAMPLES = [
  'How long do refunds take?',
  'Can I change my email address?',
  'What is the shipping policy?',
]

export default function App() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  const patchLast = useCallback((patch: (turn: Turn) => Turn) => {
    setTurns((prev) => {
      if (prev.length === 0) return prev
      const next = prev.slice()
      next[next.length - 1] = patch(next[next.length - 1])
      return next
    })
  }, [])

  const send = useCallback(
    async (question: string) => {
      const id = `turn-${idRef.current++}`
      setTurns((prev) => [
        ...prev,
        { id, question, sources: [], answer: '', status: 'streaming' },
      ])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      await streamChat(
        question,
        {
          onSources: (sources) => patchLast((t) => ({ ...t, sources })),
          onToken: (text) => patchLast((t) => ({ ...t, answer: t.answer + text })),
          onDone: () => patchLast((t) => ({ ...t, status: 'done' })),
          onError: (message) =>
            patchLast((t) => ({ ...t, status: 'error', error: message })),
        },
        controller.signal,
      )

      abortRef.current = null
      setIsStreaming(false)
    },
    [patchLast],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    patchLast((t) => (t.status === 'streaming' ? { ...t, status: 'done' } : t))
    setIsStreaming(false)
  }, [patchLast])

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Knowledge Base Q&amp;A
            </h1>
            <p className="text-xs text-gray-500">
              Grounded answers with cited sources
            </p>
          </div>
          <Chip color={isStreaming ? 'accent' : 'default'} size="sm" variant="soft">
            {isStreaming ? 'Streaming…' : 'Ready'}
          </Chip>
        </div>
      </header>

      <ScrollShadow className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {turns.length === 0 ? (
            <div className="mt-10 text-center">
              <h2 className="text-lg font-medium text-gray-700">
                Ask anything about the knowledge base
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sources appear before each answer, which streams in token by token.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => send(example)}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition hover:border-violet-400 hover:text-violet-600"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {turns.map((turn) => (
                <MessageTurn key={turn.id} turn={turn} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollShadow>

      <Composer onSend={send} onStop={stop} isStreaming={isStreaming} />
    </div>
  )
}
