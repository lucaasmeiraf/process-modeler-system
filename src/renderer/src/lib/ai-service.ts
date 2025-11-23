import { Board } from '../types/board'

// Tipos
export type AIProvider = 'openai' | 'anthropic' | 'azure'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model?: string
  temperature?: number
  endpoint?: string // Para Azure
}

/**
 * Gera o System Prompt completo a partir da Base de Conhecimento
 */
export function generateSystemPrompt(board: Board, currentProcess?: any): string {
  const parts: string[] = []

  // Instruções do Assistente Consultivo
  parts.push('Você é um assistente especializado em processos de negócio e BPMN 2.0.\n')
  parts.push('Seu objetivo é ajudar o usuário a:\n')
  parts.push('- Entender e analisar processos existentes\n')
  parts.push('- Sugerir melhorias baseadas em boas práticas de BPMN\n')
  parts.push('- Esclarecer dúvidas sobre terminologia, legislação e sistemas\n')
  parts.push('- Orientar sobre padrões e conformidade\n')
  parts.push('\nIMPORTANTE: Você NÃO deve gerar código BPMN XML. Apenas forneça orientações e sugestões.\n')
  parts.push('\n---\n\n')

  // Contexto do Processo Atual (se houver)
  if (currentProcess) {
    parts.push('## PROCESSO ATUAL EM ANÁLISE\n\n')
    parts.push(`**Título**: ${currentProcess.title}\n`)
    if (currentProcess.description) {
      parts.push(`**Descrição**: ${currentProcess.description}\n`)
    }
    parts.push('\n')
  }

  // 1. System Prompt customizado (se configurado)
  if (board.ai_config?.system_prompt) {
    parts.push(board.ai_config.system_prompt)
    parts.push('\n---\n')
  }

  // 2. Contexto Geral
  if (board.context_md) {
    parts.push('## CONTEXTO DO SETOR\n')
    parts.push(board.context_md)
    parts.push('\n')
  }

  // 3. Glossário
  if (board.glossary && board.glossary.length > 0) {
    parts.push('## GLOSSÁRIO DE TERMOS\n')
    board.glossary.forEach((term) => {
      parts.push(`- **${term.term}**: ${term.definition}\n`)
    })
    parts.push('\n')
  }

  // 4. Sistemas Integrados
  if (board.integrated_systems && board.integrated_systems.length > 0) {
    parts.push('## SISTEMAS INTEGRADOS\n')
    board.integrated_systems.forEach((system) => {
      parts.push(`- **${system.name}**: ${system.description}`)
      if (system.url) parts.push(` (${system.url})`)
      parts.push('\n')
    })
    parts.push('\n')
  }

  // 5. Legislação
  if (board.legislation && board.legislation.length > 0) {
    parts.push('## LEGISLAÇÃO APLICÁVEL\n')
    board.legislation.forEach((law) => {
      parts.push(`- **${law.title}**: ${law.description}`)
      if (law.link) parts.push(` [Link](${law.link})`)
      parts.push('\n')
    })
    parts.push('\n')
  }

  // 6. Estrutura Organizacional
  if (board.org_structure && board.org_structure.length > 0) {
    parts.push('## ESTRUTURA ORGANIZACIONAL\n')
    board.org_structure.forEach((org) => {
      parts.push(`- **${org.role}** (${org.name})`)
      if (org.responsibilities) parts.push(`: ${org.responsibilities}`)
      parts.push('\n')
    })
    parts.push('\n')
  }

  return parts.join('')
}

/**
 * Envia mensagem para a IA (OpenAI)
 */
export async function sendMessageToOpenAI(
  messages: AIMessage[],
  config: AIConfig
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Envia mensagem para a IA (Anthropic Claude)
 */
export async function sendMessageToAnthropic(
  messages: AIMessage[],
  config: AIConfig
): Promise<string> {
  // Anthropic usa formato diferente: system separado
  const systemMessage = messages.find((m) => m.role === 'system')
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-sonnet-20240229',
      system: systemMessage?.content || '',
      messages: conversationMessages,
      max_tokens: 2000,
      temperature: config.temperature ?? 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API Error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * Envia mensagem para Azure OpenAI
 */
export async function sendMessageToAzure(
  messages: AIMessage[],
  config: AIConfig
): Promise<string> {
  if (!config.endpoint) {
    throw new Error('Azure endpoint is required')
  }

  const response = await fetch(
    `${config.endpoint}/openai/deployments/${config.model}/chat/completions?api-version=2024-02-15-preview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey
      },
      body: JSON.stringify({
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: 2000
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Azure OpenAI Error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Função principal: envia mensagem para a IA com contexto da Base de Conhecimento
 */
export async function sendMessage(
  userMessage: string,
  board: Board,
  config: AIConfig,
  conversationHistory: AIMessage[] = [],
  currentProcess?: any
): Promise<string> {
  // 1. Gerar system prompt com a Base de Conhecimento e processo atual
  const systemPrompt = generateSystemPrompt(board, currentProcess)

  // 2. Montar mensagens
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]

  // 3. Enviar para o provider correto
  switch (config.provider) {
    case 'openai':
      return await sendMessageToOpenAI(messages, config)
    case 'anthropic':
      return await sendMessageToAnthropic(messages, config)
    case 'azure':
      return await sendMessageToAzure(messages, config)
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}
