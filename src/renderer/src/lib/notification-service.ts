import { supabase } from './supabase'
import { Notification } from '../types/versioning'

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data as Notification[]
}

export const markAsRead = async (notificationId: string): Promise<void> => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
}

export const markAllAsRead = async (userId: string): Promise<void> => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
}

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> => {
  await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message,
        link
      }
    ])
}
