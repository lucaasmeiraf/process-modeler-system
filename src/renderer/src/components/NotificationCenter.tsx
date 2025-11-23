import React, { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Notification } from '../types/versioning'
import { getNotifications, markAsRead, markAllAsRead } from '../lib/notification-service'
import { useAuth } from '../contexts/AuthContext'

export default function NotificationCenter(): React.ReactElement {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (user) {
            loadNotifications()
            // Poll for notifications every 30s
            const interval = setInterval(loadNotifications, 30000)
            return () => clearInterval(interval)
        }
    }, [user])

    const loadNotifications = async (): Promise<void> => {
        if (!user) return
        const data = await getNotifications(user.id)
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.read).length)
    }

    const handleMarkAsRead = async (id: string): Promise<void> => {
        await markAsRead(id)
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    const handleMarkAllRead = async (): Promise<void> => {
        if (!user) return
        await markAllAsRead(user.id)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-full transition"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-100"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-dark-100 border border-white/10 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <h3 className="font-semibold text-white text-sm">Notificações</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                                >
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-dark-400 text-sm">
                                    Nenhuma notificação.
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 border-b border-white/5 hover:bg-white/5 transition ${!notification.read ? 'bg-white/[0.02]' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-dark-300'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-dark-400 mt-1">{notification.message}</p>
                                                <p className="text-[10px] text-dark-500 mt-2">
                                                    {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-cyan-400 hover:text-cyan-300 p-1"
                                                    title="Marcar como lida"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
