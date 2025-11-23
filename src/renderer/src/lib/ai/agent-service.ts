import { BPMN_SYSTEM_PROMPT } from './prompts'

export type AgentProvider = 'openai' | 'anthropic' | 'custom'

export interface AgentConfig {
  id: string
  name: string
  provider: AgentProvider
  apiKey: string
  model: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>
}

export class AgentService {
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
  }

  async generateBPMN(messages: ChatMessage[]): Promise<string> {
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: BPMN_SYSTEM_PROMPT },
      ...messages
    ]

    if (this.config.provider === 'openai') {
      return this.callOpenAI(fullMessages)
    } else if (this.config.provider === 'anthropic') {
      return this.callAnthropic(fullMessages)
    }

    throw new Error('Provider not implemented')
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    if (this.config.provider === 'openai') {
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('model', 'whisper-1')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI Whisper API Error')
      }

      const data = await response.json()
      return data.text
    }
    
    throw new Error('Audio transcription only supported for OpenAI currently')
  }

  private async callOpenAI(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o',
          messages: messages,
          temperature: 0.2
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API Error')
      }

      const data = await response.json()
      let content = data.choices[0].message.content

      // Clean up code blocks if present
      content = content
        .replace(/```xml/g, '')
        .replace(/```/g, '')
        .trim()

      return content
    } catch (error) {
      console.error('OpenAI Call Failed:', error)
      throw error
    }
  }

  private async callAnthropic(messages: ChatMessage[]): Promise<string> {
    try {
      // Extract system message if present
      const systemMessage = messages.find((m) => m.role === 'system')
      const userMessages = messages.filter((m) => m.role !== 'system')

      // Format messages for Anthropic
      const anthropicMessages = userMessages.map((msg) => {
        if (Array.isArray(msg.content)) {
          // Handle multimodal content for Anthropic
          return {
            role: msg.role,
            content: msg.content.map((part) => {
              if (part.type === 'text') return { type: 'text', text: part.text }
              if (part.type === 'image_url') {
                // Anthropic expects base64 data without the prefix
                const base64Data = part.image_url.url.split(',')[1]
                // Detect media type from the prefix
                const mediaType = part.image_url.url.split(';')[0].split(':')[1]
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data
                  }
                }
              }
              return null
            }).filter(Boolean)
          }
        }
        return { role: msg.role, content: msg.content }
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true' // Required for client-side calls
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-5-sonnet-20240620',
          max_tokens: 4096,
          system: systemMessage ? systemMessage.content : undefined,
          messages: anthropicMessages
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Anthropic API Error')
      }

      const data = await response.json()
      let content = data.content[0].text

      // Clean up code blocks if present
      content = content
        .replace(/```xml/g, '')
        .replace(/```/g, '')
        .trim()

      return content
    } catch (error) {
      console.error('Anthropic Call Failed:', error)
      throw error
    }
  }
}

export const getStoredAgents = (): AgentConfig[] => {
  const stored = localStorage.getItem('dnit_bpmn_agents')
  return stored ? JSON.parse(stored) : []
}

export const saveAgent = (agent: AgentConfig) => {
  const agents = getStoredAgents()
  const index = agents.findIndex((a) => a.id === agent.id)
  if (index >= 0) {
    agents[index] = agent
  } else {
    agents.push(agent)
  }
  localStorage.setItem('dnit_bpmn_agents', JSON.stringify(agents))
}

export const deleteAgent = (id: string) => {
  const agents = getStoredAgents().filter((a) => a.id !== id)
  localStorage.setItem('dnit_bpmn_agents', JSON.stringify(agents))
}
