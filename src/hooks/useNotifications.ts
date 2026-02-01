import { useState, useCallback } from 'react';
import { NotificationType } from '../ui/Notification';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback((message: string) => addNotification('success', message), [addNotification]);
  const error = useCallback((message: string) => addNotification('error', message), [addNotification]);
  const info = useCallback((message: string) => addNotification('info', message), [addNotification]);
  const warning = useCallback((message: string) => addNotification('warning', message), [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  };
}
