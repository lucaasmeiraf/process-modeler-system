import { supabase } from './supabase'
import { Board, BoardKnowledgeBase } from '../types/board'

export const getBoard = async (id: string): Promise<Board | null> => {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching board:', error)
    return null
  }

  return data as Board
}

export const updateBoardKnowledgeBase = async (
  id: string,
  knowledgeBase: Partial<BoardKnowledgeBase>
): Promise<Board | null> => {
  const { data, error } = await supabase
    .from('boards')
    .update(knowledgeBase)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating board knowledge base:', error)
    throw error
  }

  return data as Board
}

export const uploadBoardDocument = async (
  boardId: string,
  file: File
): Promise<{ path: string; url: string } | null> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${boardId}/${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('board-documents')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('board-documents').getPublicUrl(filePath)

  return { path: filePath, url: data.publicUrl }
}
