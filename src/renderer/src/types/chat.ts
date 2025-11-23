export interface ChatThread {
  id: string
  thread_id: string // OpenAI thread ID
  user_id: string
  board_id: string | null
  process_id: string | null
  title: string
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: number
}
