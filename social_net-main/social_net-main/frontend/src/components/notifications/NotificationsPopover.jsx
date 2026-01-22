import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/store/slices/notificationsSlice";
import { followerService } from "@/services/follower.service";
import { cn } from "@/lib/utils";

import { NotificationItem } from "./NotificationItem";

export function NotificationsPopover() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotificationClick = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleOpenChange = (open) => {
      if (open && unreadCount > 0) {
          dispatch(markAllNotificationsAsRead());
      }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative rounded-full w-10 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Open notifications">
          <Bell size={20} strokeWidth={2} aria-hidden="true" className="text-zinc-600 dark:text-zinc-300" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1 bg-red-500 hover:bg-red-600 border-none text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1 mr-4" align="end">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>

        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="-mx-1 my-1 h-px bg-border"
        ></div>
        <div className="max-h-[300px] overflow-y-auto">
         {notifications.length === 0 ? (
           <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.map((notification) => (
             <NotificationItem 
                key={notification._id || notification.id} 
                notification={notification} 
                onClick={handleNotificationClick} 
             />
          ))
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
