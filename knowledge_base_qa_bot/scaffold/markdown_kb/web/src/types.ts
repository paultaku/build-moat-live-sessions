export type Source = {
  source: string
  heading: string
  score: number
  content: string
}

export type TurnStatus = 'streaming' | 'done' | 'error'

export type Turn = {
  id: string
  question: string
  sources: Source[]
  answer: string
  status: TurnStatus
  error?: string
}
