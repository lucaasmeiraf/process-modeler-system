export type ProcessStatus = 'draft' | 'pending_review' | 'published'

export interface Process {
  id: string
  board_id: string
  title: string
  description: string | null
  bpmn_xml: string | null
  status: ProcessStatus
  current_version_id: string | null
  tags: string[]
  responsible_role: string | null
  department: string | null
  created_at: string
  updated_at: string
  created_by: string
}
