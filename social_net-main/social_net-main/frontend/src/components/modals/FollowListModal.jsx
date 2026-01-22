import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { followerService } from '@/services/follower.service';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function FollowListModal({ isOpen, onClose, userId, type, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.auth.user);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = type === 'followers' 
            ? await followerService.getFollowers(userId)
            : await followerService.getFollowing(userId);
          setUsers(response || []);
        } catch (error) {
          console.error(`Error fetching ${type}:`, error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, userId, type]);

  const handleFollowToggle = async (e, targetUserId, isCurrentlyFollowing) => {
    e.stopPropagation();
    if (actionLoading[targetUserId]) return;

    try {
      setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
      if (isCurrentlyFollowing) {
        await followerService.unfollowUser(targetUserId);
      } else {
        await followerService.followUser(targetUserId);
      }
      
      // Update local state
      setUsers(prevUsers => prevUsers.map(user => 
        user._id === targetUserId 
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      ));
    } catch (error) {
      console.error("Follow toggle error:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleRemoveFollower = async (e, targetUserId) => {
    e.stopPropagation();
    if (actionLoading[targetUserId]) return;

    try {
      setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
      await followerService.removeFollower(targetUserId);
      
      // Remove user from the list locally
      setUsers(prevUsers => prevUsers.filter(user => user._id !== targetUserId));
    } catch (error) {
      console.error("Remove follower error:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUserClick = (targetUserId) => {
    navigate(`/profile/${targetUserId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-border/10">
          <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-2 py-4 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
              <p className="text-sm font-medium">Fetching users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <div className="p-4 bg-muted/30 rounded-full">
                <UserPlus className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-lg font-medium opacity-60">No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div 
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 group/user"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    user={user}
                    className="w-11 h-11 rounded-full object-cover border border-border/50 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover/user:text-primary transition-colors">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                </div>

                {currentUser && currentUser._id !== user._id && (
                  <Button
                    size="sm"
                    variant={
                      type === 'followers' && currentUser._id === userId // userId prop is the profile being viewed
                      ? "outline" // State when viewing own followers
                      : user.isFollowing ? "outline" : "default"
                    }
                    onClick={(e) => {
                      if (type === 'followers' && currentUser._id === userId) {
                         handleRemoveFollower(e, user._id);
                      } else {
                         handleFollowToggle(e, user._id, user.isFollowing);
                      }
                    }}
                    className={cn(
                        "rounded-full px-4 h-8 text-xs font-bold transition-all",
                        type === 'followers' && currentUser._id === userId
                        ? "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
                        : user.isFollowing 
                            ? "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30" 
                            : "bg-primary text-primary-foreground shadow-md hover:shadow-lg active:scale-95"
                    )}
                  >
                    {actionLoading[user._id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : type === 'followers' && currentUser._id === userId ? (
                      "Remove"
                    ) : user.isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
