export interface GlossaryTerm {
  id: string
  term: string
  definition: string
}

export interface SystemItem {
  id: string
  name: string
  description: string
  url?: string
}

export interface LegislationItem {
  id: string
  title: string
  description: string
  link?: string
}

export interface OrgItem {
  id: string
  role: string
  name: string
  contact?: string
  responsibilities?: string
}

export interface BoardDocument {
  id: string
  name: string
  url: string
  type: string
  size?: number
  uploaded_at: string
}

export interface BoardKnowledgeBase {
  context_md?: string
  glossary?: GlossaryTerm[]
  integrated_systems?: SystemItem[]
  legislation?: LegislationItem[]
  org_structure?: OrgItem[]
  documents?: BoardDocument[]
  ai_config?: {
    system_prompt?: string
    model?: string
    temperature?: number
  }
}

export interface Board extends BoardKnowledgeBase {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
}
