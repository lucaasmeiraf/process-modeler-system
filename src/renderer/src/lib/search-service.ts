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

  // Text Search (Basic ILIKE for now, can be upgraded to Full Text Search)
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

  return (data as Process[]).map((process) => ({
    process,
    matchType: 'title' // Simplified for now
  }))
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
