import { useState, type KeyboardEvent } from 'react'
import { Button } from '@heroui/react'

type Props = {
  onSend: (question: string) => void
  onStop: () => void
  isStreaming: boolean
}

export function Composer({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const question = value.trim()
    if (!question || isStreaming) return
    onSend(question)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3">
        <textarea
          className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          placeholder="Ask a question about the knowledge base…  (Enter to send, Shift+Enter for newline)"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {isStreaming ? (
          <Button variant="danger" onPress={onStop}>
            Stop
          </Button>
        ) : (
          <Button variant="primary" onPress={submit} isDisabled={!value.trim()}>
            Send
          </Button>
        )}
      </div>
    </div>
  )
}
