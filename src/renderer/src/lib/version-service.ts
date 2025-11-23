import { supabase } from './supabase'
import { ProcessVersion, DiffResult } from '../types/versioning'

export const createVersion = async (
  processId: string,
  xml: string,
  comment: string,
  userId: string
): Promise<ProcessVersion | null> => {
  // 1. Get current max version number
  const { data: maxVersionData } = await supabase
    .from('process_versions')
    .select('version_number')
    .eq('process_id', processId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = (maxVersionData?.version_number || 0) + 1

  // 2. Insert new version
  const { data, error } = await supabase
    .from('process_versions')
    .insert([
      {
        process_id: processId,
        bpmn_xml: xml,
        version_number: nextVersionNumber,
        comment,
        status: 'approved', // Auto-approve for now, or 'pending' if workflow enabled
        created_by: userId
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating version:', error)
    throw error
  }

  // 3. Update process current_version_id
  await supabase
    .from('processes')
    .update({ current_version_id: data.id, version: nextVersionNumber })
    .eq('id', processId)

  return data as ProcessVersion
}

export const getVersions = async (processId: string): Promise<ProcessVersion[]> => {
  const { data, error } = await supabase
    .from('process_versions')
    .select(`
      *,
      created_by_user:profiles(full_name, email)
    `)
    .eq('process_id', processId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('Error fetching versions:', error)
    return []
  }

  return data as any
}

export const restoreVersion = async (processId: string, version: ProcessVersion): Promise<void> => {
  // Update process with the XML from the selected version
  // We do NOT delete newer versions, just update the current state
  // Ideally, we might want to create a NEW version that is a copy of the old one to preserve history linear
  
  // Strategy: Create a new version that copies the old XML
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('User not authenticated')

  await createVersion(
    processId,
    version.bpmn_xml || '',
    `Restored from version ${version.version_number}`,
    userData.user.id
  )
}

// Basic XML Diff Logic (Semantic)
export const compareVersions = (xml1: string, xml2: string): DiffResult => {
  const parser = new DOMParser()
  const doc1 = parser.parseFromString(xml1, 'text/xml')
  const doc2 = parser.parseFromString(xml2, 'text/xml')

  const getElements = (doc: Document) => {
    const elements = new Map<string, Element>()
    const nodes = doc.getElementsByTagName('*')
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.id) {
        elements.set(node.id, node)
      }
    }
    return elements
  }

  const map1 = getElements(doc1)
  const map2 = getElements(doc2)

  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  const details: DiffResult['details'] = {}

  // Check for added and modified
  map2.forEach((node2, id) => {
    if (!map1.has(id)) {
      added.push(id)
      details[id] = { type: 'added' }
    } else {
      const node1 = map1.get(id)!
      // Simple check: compare attributes (name, type)
      // This is a basic check. For full BPMN diff, we'd need to check all props.
      if (node1.getAttribute('name') !== node2.getAttribute('name')) {
        modified.push(id)
        details[id] = { type: 'modified', changes: ['name'] }
      }
    }
  })

  // Check for removed
  map1.forEach((_, id) => {
    if (!map2.has(id)) {
      removed.push(id)
      details[id] = { type: 'removed' }
    }
  })

  return { added, removed, modified, details }
}
