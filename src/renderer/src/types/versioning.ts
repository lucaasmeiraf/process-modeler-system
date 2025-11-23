export type VersionStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type ProcessStatus = 'draft' | 'pending_review' | 'published'

export interface ProcessVersion {
  id: string
  process_id: string
  bpmn_xml: string | null
  version_number: number
  comment: string | null
  status: VersionStatus
  created_by: string
  created_at: string
  created_by_user?: {
    full_name: string
    email: string
  }
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

export interface DiffResult {
  added: string[] // IDs of added elements
  removed: string[] // IDs of removed elements
  modified: string[] // IDs of modified elements
  details: {
    [id: string]: {
      type: 'added' | 'removed' | 'modified'
      changes?: string[]
    }
  }
}
