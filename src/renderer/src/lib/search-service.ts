import { supabase } from './supabase'
import { Process } from '../types/process'

export interface SearchResult {
  process: Process
  snippet?: string
  matchType: 'title' | 'description' | 'tag' | 'content'
}

export interface SearchFilters {
  status?: string
  tag?: string
  responsible_role?: string
  department?: string
}

export const searchProcesses = async (
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResult[]> => {
  let dbQuery = supabase
    .from('processes')
    .select('*')

  // Apply Filters
  if (filters.status) {
    dbQuery = dbQuery.eq('status', filters.status)
  }
  if (filters.tag) {
    dbQuery = dbQuery.contains('tags', [filters.tag])
  }
  if (filters.responsible_role) {
    dbQuery = dbQuery.ilike('responsible_role', `%${filters.responsible_role}%`)
  }
  if (filters.department) {
    dbQuery = dbQuery.ilike('department', `%${filters.department}%`)
  }

  // If query is present, we might need to fetch MORE to search content locally
  // For metadata search:
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching processes:', error)
    return []
  }

  // TODO: Implement content search within BPMN XML if needed (requires fetching XML or indexing it)
  // For now, we return matches based on metadata

  const results: SearchResult[] = []
  const lowerQuery = query.toLowerCase()
  const processes = data as Process[]

  // Process results
  for (const process of processes) {
    let matchType: SearchResult['matchType'] = 'title'
    let snippet: string | undefined

    // 1. Metadata Match
    if (process.title.toLowerCase().includes(lowerQuery)) {
      matchType = 'title'
    } else if (process.description?.toLowerCase().includes(lowerQuery)) {
      matchType = 'description'
      snippet = process.description
    } else if (process.tags?.some((t) => t.toLowerCase().includes(lowerQuery))) {
      matchType = 'tag'
    }

    // 2. Content Match (if no metadata match or just to add more context)
    // We only search content if we have a query and XML
    if (query && process.bpmn_xml) {
      const contentMatch = searchBPMNContent(process.bpmn_xml, lowerQuery)
      if (contentMatch) {
        if (!matchType || matchType === 'title') {
          // If it was just a title match or no match yet
          matchType = 'content'
          snippet = contentMatch
        }
      }
    }

    results.push({
      process,
      matchType,
      snippet
    })
  }

  return results
}

const searchBPMNContent = (xml: string, query: string): string | null => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const elements = doc.getElementsByTagName('*')
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      const name = el.getAttribute('name')
      if (name && name.toLowerCase().includes(query)) {
        // Found a match
        const type = el.tagName.replace('bpmn:', '') // e.g., 'Task'
        return `Found in ${type}: "${name}"`
      }
      
      // Also check documentation/textAnnotation if needed
      // const text = el.textContent
      // if (text && text.toLowerCase().includes(query)) ...
    }
  } catch (e) {
    console.error('XML Parse error', e)
  }
  return null
}

export const updateProcessMetadata = async (
  processId: string,
  updates: Partial<Process>
): Promise<void> => {
  const { error } = await supabase
    .from('processes')
    .update(updates)
    .eq('id', processId)

  if (error) {
    console.error('Error updating process metadata:', error)
    throw error
  }
}
