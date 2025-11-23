import OpenAI from 'openai'
import { supabase } from './supabase'
import { ChatThread } from '../types/chat'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

/**
 * Cria um novo thread no OpenAI e salva no Supabase
 */
export async function createThread(
  userId: string,
  boardId: string | null,
  processId: string | null,
  title: string
): Promise<ChatThread> {
  // 1. Criar thread no OpenAI
  const thread = await openai.beta.threads.create()

  // 2. Salvar no Supabase
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      thread_id: thread.id,
      user_id: userId,
      board_id: boardId,
      process_id: processId,
      title: title || 'Nova Conversa'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Lista threads do usuário
 */
export async function listUserThreads(
  userId: string,
  boardId?: string
): Promise<ChatThread[]> {
  let query = supabase
    .from('chat_threads')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })

  if (boardId) {
    query = query.eq('board_id', boardId)
  }

  const { data, error} = await query

  if (error) throw error
  return data || []
}

/**
 * Envia mensagem para um thread usando Assistant
 */
export async function sendMessageToThread(
  threadId: string,
  message: string,
  assistantId: string
): Promise<string> {
  // 1. Adicionar mensagem ao thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message
  })

  // 2. Criar run (executar assistente)
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  })

  // 3. Aguardar conclusão
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
  
  while (runStatus.status !== 'completed') {
    if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
      throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`)
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
  }

  // 4. Obter resposta
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'desc',
    limit: 1
  })

  const lastMessage = messages.data[0]
  const content = lastMessage.content[0]
  
  if (content.type === 'text') {
    return content.text.value
  }

  throw new Error('Unexpected message type')
}

/**
 * Obtém histórico de mensagens de um thread
 */
export async function getThreadMessages(threadId: string): Promise<any[]> {
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'asc'
  })

  return messages.data.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
    created_at: msg.created_at
  }))
}

/**
 * Atualiza timestamp da última mensagem
 */
export async function updateThreadTimestamp(threadId: string): Promise<void> {
  await supabase
    .from('chat_threads')
    .update({ 
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('thread_id', threadId)
}

/**
 * Atualiza título do thread
 */
export async function updateThreadTitle(threadId: string, title: string): Promise<void> {
  await supabase
    .from('chat_threads')
    .update({ 
      title,
      updated_at: new Date().toISOString()
    })
    .eq('thread_id', threadId)
}

/**
 * Deleta thread
 */
export async function deleteThread(threadId: string): Promise<void> {
  // 1. Deletar do OpenAI
  try {
    await openai.beta.threads.del(threadId)
  } catch (error) {
    console.error('Error deleting thread from OpenAI:', error)
  }

  // 2. Deletar do Supabase
  await supabase
    .from('chat_threads')
    .delete()
    .eq('thread_id', threadId)
}
