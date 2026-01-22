import React from 'react';
import { Button } from "@/components/ui/button";
import { followerService } from "@/services/follower.service";
import { cn } from "@/lib/utils";
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useDispatch } from 'react-redux';
import { acceptFollowRequest, rejectFollowRequest, followUser, unfollowUser } from '@/store/slices/userSlice';
import { Link } from 'react-router-dom';

export function Dot() {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

export function NotificationItem({ notification, onClick }) {
    const dispatch = useDispatch();
    const [followsBack, setFollowsBack] = React.useState(notification.isFollowingSender);
    const [requestStatus, setRequestStatus] = React.useState(notification.followRequestStatus);
    const [loading, setLoading] = React.useState(false);

    const handleAccept = async (e) => {
        e.stopPropagation();
        try {
            setLoading(true);
            await dispatch(acceptFollowRequest(notification.sender._id)).unwrap();
            setRequestStatus("ACCEPTED");
        } catch (error) {
            console.error("Accept error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (e) => {
        e.stopPropagation();
        try {
            setLoading(true);
            await dispatch(rejectFollowRequest(notification.sender._id)).unwrap();
            setRequestStatus("REJECTED");
        } catch (error) {
            console.error("Reject error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowBack = async (e) => {
        e.stopPropagation();
        try {
            setLoading(true);
            if (followsBack) {
                 await dispatch(unfollowUser(notification.sender._id)).unwrap();
                 setFollowsBack(false);
            } else {
                 await dispatch(followUser(notification.sender._id)).unwrap();
                 setFollowsBack(true);
            }
        } catch (error) {
            console.error("Follow error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={cn(
                "rounded-3xl px-4 py-4 mb-2 text-sm transition-all duration-200 cursor-pointer border border-transparent self-stretch group",
                !notification.isRead 
                    ? "bg-primary/[0.03] dark:bg-primary/[0.05] border-primary/10 shadow-sm" 
                    : "hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
            )}
            onClick={() => onClick(notification._id || notification.id)}
        >
            <div className="relative flex items-start gap-4 pe-3">
                <Link to={`/profile/${notification.sender._id}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <UserAvatar
                        className="size-10 rounded-full object-cover border border-border"
                        user={notification.sender}
                        width={40}
                        height={40}
                    />
                </Link>
                <div className="flex-1 space-y-1">
                    <p className="text-left text-foreground/80 leading-snug">
                          <Link 
                            to={`/profile/${notification.sender?._id}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline flex items-center gap-1.5 min-w-0 group/sender"
                          >
                   <span className="font-extrabold text-foreground truncate">{notification.sender?.firstName} {notification.sender?.lastName}</span>
                   {notification.sender?.handle && <span className="text-primary text-[10px] font-bold truncate opacity-80">{notification.sender.handle}</span>}
                 </Link>{" "}
                        {notification.type === "FOLLOW_REQUEST" ? "sent you a follow request" : 
                         notification.type === "FOLLOW_ACCEPTED" ? "accepted your follow request" :
                         notification.type === "NEW_FOLLOWER" ? "followed you" :
                         notification.type === "LIKE" ? "liked your post" : 
                         notification.type === "COMMENT" ? "commented on your post" :
                         notification.type === "NEW_THREAD" ? "mentioned you" : "interacted with you"}
                    </p>
                    {notification.thread && notification.thread.content && (
                         <p className="text-muted-foreground line-clamp-1 italic text-xs mt-1 bg-muted/30 px-2 py-1 rounded">
                            "{notification.thread.content}"
                         </p>
                    )}
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 pt-1">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : "Just now"}
                    </div>
                    {notification.type === 'FOLLOW_REQUEST' && (
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                wants to follow you
              </p>
            )}
                    {notification.type === "FOLLOW_REQUEST" && (
                        <div className="pt-2 flex gap-2">
                             {requestStatus === "ACCEPTED" ? (
                                <Button 
                                    size="sm" 
                                    variant={followsBack ? "outline" : "default"}
                                    className={cn("h-8 px-4 text-xs font-semibold rounded-full", followsBack && "text-muted-foreground bg-muted")}
                                    onClick={handleFollowBack}
                                    disabled={loading}
                                >
                                    {loading ? "..." : followsBack ? "Following" : "Follow Back"}
                                </Button>
                             ) : requestStatus === "REJECTED" ? (
                                <span className="text-xs text-muted-foreground font-medium py-1 px-2">Request rejected</span>
                             ) : (
                                <>
                                    <Button 
                                        size="sm" 
                                        className="h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-full"
                                        onClick={handleAccept}
                                        disabled={loading}
                                    >
                                        Accept
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="h-8 px-4 text-xs font-semibold rounded-full"
                                        onClick={handleReject}
                                        disabled={loading}
                                    >
                                        Reject
                                    </Button>
                                </>
                             )}
                        </div>
                    )}
                    {notification.type === "NEW_FOLLOWER" && (
                        <div className="pt-1">
                             <Button 
                                size="sm" 
                                variant={followsBack ? "outline" : "default"}
                                className={cn("h-8 px-4 text-xs font-semibold rounded-full", followsBack && "text-muted-foreground bg-muted")}
                                onClick={handleFollowBack}
                                disabled={loading}
                             >
                                {loading ? "..." : followsBack ? "Following" : "Follow Back"}
                             </Button>
                        </div>
                    )}
                </div>
                {!notification.isRead && (
                    <div className="absolute end-0 self-center">
                        <Dot />
                    </div>
                )}
            </div>
        </div>
    );
}
