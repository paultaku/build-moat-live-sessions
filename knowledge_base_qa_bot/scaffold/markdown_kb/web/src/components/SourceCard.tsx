import { Card, CardHeader, CardContent, Code } from '@heroui/react'
import type { Source } from '../types'

export function SourceCard({ source }: { source: Source }) {
  return (
    <Card className="border border-gray-200 bg-white/70">
      <CardHeader className="flex flex-wrap items-center gap-2 pb-1">
        <Code>{source.source}</Code>
        <span className="text-xs text-gray-500">{source.heading}</span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
          {source.content}
        </p>
      </CardContent>
    </Card>
  )
}
