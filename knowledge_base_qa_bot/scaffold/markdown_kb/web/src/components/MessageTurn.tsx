import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Spinner,
} from '@heroui/react'
import type { Turn } from '../types'
import { SourceCard } from './SourceCard'

export function MessageTurn({ turn }: { turn: Turn }) {
  const waiting = turn.status === 'streaming' && turn.answer.length === 0

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-violet-600 px-4 py-2 text-white shadow-sm">
          {turn.question}
        </div>
      </div>

      <div className="space-y-2">
        {turn.sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Sources
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {turn.sources.map((source) => (
                <SourceCard key={source.source} source={source} />
              ))}
            </div>
          </div>
        )}

        {turn.status === 'error' ? (
          <Alert status="danger">
            <AlertContent>
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{turn.error}</AlertDescription>
            </AlertContent>
          </Alert>
        ) : waiting ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size="sm" color="current" />
            <span>Searching the knowledge base…</span>
          </div>
        ) : (
          <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed text-gray-800">
              {turn.answer}
              {turn.status === 'streaming' && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-violet-500 align-middle" />
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
