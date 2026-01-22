import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  clearAllNotifications
} from '@/store/slices/notificationsSlice';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';

export function NotificationsPage() {
  const dispatch = useDispatch();
  const { notifications, loading, unreadCount } = useSelector((state) => state.notifications);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAllNotifications());
      // Automatically mark all as read when entering the page
      dispatch(markAllNotificationsAsRead());
    }
  }, [dispatch, isAuthenticated]);

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleClearAll = () => {
    setIsClearModalOpen(true);
  };

  const handleConfirmClear = async () => {
    await dispatch(clearAllNotifications());
    setIsClearModalOpen(false);
  };

  const handleNotificationClick = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <div className="w-full py-6 px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
            <p className="text-[13px] font-medium text-muted-foreground/70">
              You have {unreadCount} unread notifications
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">

          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              className="rounded-full gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear History</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1 bg-card/30 rounded-3xl border border-border/40 overflow-hidden shadow-sm mx-2 md:mx-4">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            <p className="text-sm font-medium">Loading your notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <div className="p-4 bg-muted/30 rounded-full">
              <Bell className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-lg font-medium opacity-60">Nothing to see here yet</p>
            <p className="text-sm opacity-40 max-w-[200px] text-center">
              When people interact with you, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {notifications.map((notification) => (
              <NotificationItem 
                key={notification._id || notification.id} 
                notification={notification} 
                onClick={handleNotificationClick} 
              />
            ))}
          </div>
        )}
      </div>

      <DeleteAlertModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        loading={loading}
        title="Clear Notifications"
        description="Are you sure you want to clear your entire notification history? This action cannot be undone."
      />
    </div>
  );
}
