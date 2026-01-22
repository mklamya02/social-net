import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { EditPostModal } from '@/components/modals/EditPostModal';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SocialCard } from '@/components/ui/social-card';
import { userService } from '@/services/user.service';
import { postService } from '@/services/post.service';
import { followUser, unfollowUser } from '@/store/slices/userSlice';
import { cn, formatRelativeTime } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { MapPin, Link as LinkIcon, Calendar, MessageSquare, Lock, Cake } from 'lucide-react';
import { openAuthModal } from '@/store/slices/uiSlice';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FollowListModal } from '@/components/modals/FollowListModal';
import { PostComments } from '@/components/feed/PostComments';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { UserBanner } from '@/components/ui/UserBanner';
import socketService from '@/services/socket';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
// Profile Page Component
export function ProfilePage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useSelector(state => state.auth);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  const [recentComments, setRecentComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [updatedComment, setUpdatedComment] = useState(null);
  const [justDeletedCommentId, setJustDeletedCommentId] = useState(null);
  const [replying, setReplying] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState('followers'); // 'followers' or 'following'
 
  const isOwnProfile = isAuthenticated && (id === 'me' || id === (currentUser?._id || currentUser?.id));
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if following
  useEffect(() => {
    if (profile && currentUser && !isOwnProfile) {
       setIsFollowing(profile.isFollowing || false);
    }
  }, [profile, currentUser, isOwnProfile]);

  const handleFollowToggle = async () => {
    requireAuth(async () => {
      try {
        if (isFollowing || profile.followStatus === 'PENDING') {
          dispatch(unfollowUser(profile._id));
          setIsFollowing(false);
          setProfile(prev => ({ 
              ...prev, 
              // Don't decrement count here - socket 'user_updated' will handle it
              isFollowing: false,
              followStatus: null
          }));
        } else {
          const result = await dispatch(followUser(profile._id));
          const responseData = result.payload;
          const status = responseData?.status || (profile.isPrivate ? 'PENDING' : 'ACCEPTED');
          
          if (status === 'ACCEPTED') {
              setIsFollowing(true);
              setProfile(prev => ({ 
                  ...prev, 
                  // Don't increment count here - socket 'user_updated' will handle it
                  isFollowing: true,
                  followStatus: 'ACCEPTED'
              }));
          } else {
              setProfile(prev => ({ 
                  ...prev, 
                  followStatus: 'PENDING'
              }));
          }
        }
      } catch (error) {
        console.error("Follow toggle failed", error);
      }
    });
  };

  const fetchLikedPosts = async () => {
    try {
        setLoadingLikes(true);
        const response = await postService.getLikedThreads(1, 40);
        setLikedPosts(response.threads || response || []);
    } catch (error) {
        console.error("Failed to fetch likes", error);
    } finally {
        setLoadingLikes(false);
    }
  };

  const fetchArchivedPosts = async () => {
    try {
        setLoadingArchived(true);
        const response = await postService.getArchivedPosts(1, 40);
        setArchivedPosts(response.threads || response || []);
    } catch (error) {
        console.error("Failed to fetch archived posts", error);
    } finally {
        setLoadingArchived(false);
    }
  };

  const fetchProfileAndPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = id === 'me' ? (currentUser?._id || currentUser?.id) : id;
      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const profileData = await userService.getProfile(userId);
      setProfile(profileData);

      const response = await userService.getUserPosts(userId, 1, 5);
      const userPosts = response.threads || response || [];
      setPosts(userPosts);
      
      if (response.pagination) {
          setHasMore(response.pagination.currentPage < response.pagination.totalPages);
          setPage(1);
      } else {
          setHasMore(false);
      }
      
      if (activeTab === 'likes' && (isOwnProfile || !profileData.isPrivate)) {
          fetchLikedPosts();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser, isOwnProfile, activeTab]);

  const loadMore = async () => {
    if (!hasMore || loading || fetchingMore || activeTab !== 'posts') return;
    try {
      setFetchingMore(true);
      const userId = id === 'me' ? (currentUser?._id || currentUser?.id) : id;
      const response = await userService.getUserPosts(userId, page + 1, 5);
      const newPosts = response.threads || [];
      
      setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNew = newPosts.filter(p => !existingIds.has(p._id));
          return [...prev, ...uniqueNew];
      });
      
      if (response.pagination) {
          setPage(response.pagination.currentPage);
          setHasMore(response.pagination.currentPage < response.pagination.totalPages);
      } else {
          setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more posts", err);
    } finally {
      setFetchingMore(false);
    }
  };

  const { observerRef } = useInfiniteScroll(loadMore, hasMore, loading || fetchingMore);

  useEffect(() => {
    if (isAuthenticated || id !== 'me') {
      fetchProfileAndPosts();
    } else {
      setLoading(false);
      setError('Please log in to view your profile');
    }
  }, [id, currentUser, isAuthenticated, fetchProfileAndPosts]);

  useEffect(() => {
      if (activeTab === 'likes' && likedPosts.length === 0 && profile && !profile.isPrivateView) {
          fetchLikedPosts();
      }
      if (activeTab === 'archived' && archivedPosts.length === 0 && isOwnProfile) {
          fetchArchivedPosts();
      }
  }, [activeTab, profile, isOwnProfile]);

  // Real-time updates
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const onUserUpdate = (data) => {
      if (profile && data.userId === profile._id) {
          setProfile(prev => ({ ...prev, ...data.updates }));
      }
    };

    const onPostUpdate = (data) => {
       const updater = (list) => list.map(p => {
            const targetId = p._id || p.id;
            if (targetId === data.postId) {
                // Merge updates, careful with nested objects if any, but data is usually { likeCount, commentCount }
                return { ...p, ...data };
            }
            if (p.repostOf && (p.repostOf._id || p.repostOf.id) === data.postId) {
                return { ...p, repostOf: { ...p.repostOf, ...data } };
            }
            return p;
       });
       setPosts(prev => updater(prev));
       setLikedPosts(prev => updater(prev));
       setArchivedPosts(prev => updater(prev));
    };

    socket.on('user_updated', onUserUpdate);
    socket.on('post_updated', onPostUpdate);

    return () => {
       socket.off('user_updated', onUserUpdate);
       socket.off('post_updated', onPostUpdate);
    };
  }, [profile]);

  const handleReplySubmit = async (content) => {
      if (!replyingTo) return;
      setReplying(true);
      try {
          // replyingTo structure: { id, type, threadId }
          const { id, type, threadId } = replyingTo;
          const parentCommentId = type === 'comment' ? id : null; 

          const response = await postService.addComment(threadId, content, parentCommentId);
          const comment = response.comment || response; 
          
          setRecentComments(prev => ({
              ...prev,
              [threadId]: comment
          }));
          
          const updateList = (list) => list.map(p => {
              if ((p._id || p.id) === threadId) {
                  return { ...p, commentCount: (p.commentCount || 0) + 1 };
              }
              if (p.repostOf && (p.repostOf._id || p.repostOf.id) === threadId) {
                  return { 
                      ...p, 
                      repostOf: { 
                          ...p.repostOf, 
                          commentCount: (p.repostOf.commentCount || 0) + 1 
                      }
                  };
              }
              return p;
          });
          setPosts(prev => updateList(prev));
          setLikedPosts(prev => updateList(prev));
          setArchivedPosts(prev => updateList(prev));
          
          setReplyingTo(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };

  const handleCommentEditSubmit = async (content) => {
      if (!editingComment) return;
      setReplying(true); 
      try {
          const response = await postService.updateComment(editingComment._id, content);
          const updated = response.comment || response; 
          setUpdatedComment(updated);
          setEditingComment(null);
      } catch (error) {
          console.error("Failed to update comment", error);
      } finally {
          setReplying(false);
      }
  };

  const handleCommentDelete = async () => {
      if (!deletingCommentId) return;
      setReplying(true); 
      try {
          await postService.deleteComment(deletingCommentId);
          setJustDeletedCommentId(deletingCommentId);
          setDeletingCommentId(null);
      } catch (error) {
          console.error("Failed to delete comment", error);
      } finally {
          setReplying(false);
      }
  };

  const handleLike = async (postId, currentlyLiked) => {
    requireAuth(async () => {
      try {
        if (currentlyLiked) {
          await postService.unlikePost(postId);
        } else {
          await postService.likePost(postId);
        }
        
        const updateList = (list) => list.map(p => {
          let updatedP = { ...p };
          if (updatedP._id === postId) {
            updatedP.isLiked = !currentlyLiked;
            updatedP.likeCount = currentlyLiked ? Math.max(0, updatedP.likeCount - 1) : (updatedP.likeCount || 0) + 1;
          }
          if (updatedP.repostOf && updatedP.repostOf._id === postId) {
            updatedP.repostOf.isLiked = !currentlyLiked;
            updatedP.repostOf.likeCount = currentlyLiked ? Math.max(0, updatedP.repostOf.likeCount - 1) : (updatedP.repostOf.likeCount || 0) + 1;
          }
          return updatedP;
        });

        setPosts(prev => updateList(prev));
        setLikedPosts(prev => updateList(prev));
      } catch (error) {
        console.error("Like failed", error);
      }
    });
  };

  const handleAction = async (postId, action, authorId) => {
    requireAuth(async () => {
        if (action === 'bookmarked') {
            const response = await postService.bookmarkPost(postId);
            const updateList = (list) => list.map(p => {
                let updatedP = { ...p };
                if (updatedP._id === postId) updatedP.isBookmarked = response.isBookmarked;
                if (updatedP.repostOf && updatedP.repostOf._id === postId) updatedP.repostOf.isBookmarked = response.isBookmarked;
                return updatedP;
            });
            setPosts(prev => updateList(prev));
            setLikedPosts(prev => updateList(prev));
        } else if (action === 'delete') {
             setDeletingPostId(postId);
        } else if (action === 'archive') {
            await postService.archivePost(postId);
            
            setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
            setLikedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
            setArchivedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));

            if (isOwnProfile) {
              setProfile(prev => ({ ...prev, postsCount: Math.max(0, (prev.postsCount || 0) - 1) }));
            }
        } else if (action === 'unarchive') {
            await postService.unarchivePost(postId);
            setArchivedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
            
            if (isOwnProfile) {
               setProfile(prev => ({ ...prev, postsCount: (prev.postsCount || 0) + 1 }));
            }
        } else if (action === 'edit') {
            const post = posts.find(p => (p._id || p.id) === postId) || likedPosts.find(p => (p._id || p.id) === postId) || archivedPosts.find(p => (p._id || p.id) === postId);
            setEditingPost(post);
        } else if (action === 'follow' || action === 'unfollow') {
            if (action === 'follow') {
                // If already pending, unfollow will cancel it
                if (profile?.followStatus === 'PENDING') {
                    await followerService.unfollowUser(authorId);
                } else {
                    await followerService.followUser(authorId);
                }
            } else {
                await followerService.unfollowUser(authorId);
            }
            fetchProfileAndPosts();
        } else if (action === 'commented') {
            // authorId here might be the comment object passed from onReply if it has a thread property
            if (typeof authorId === 'object' && authorId.thread) {
                 setReplyingTo({ 
                     id: postId, 
                     type: 'comment', 
                     threadId: authorId.thread,
                     mentionName: authorId.author?.firstName + ' ' + authorId.author?.lastName
                 });
            } else {
                 setReplyingTo({ id: postId, type: 'post', threadId: postId });
            }
        } else if (action === 'edit_comment') {
            setEditingComment(authorId); // authorId is comment object
        } else if (action === 'delete_comment') {
            setDeletingCommentId(postId); // postId is commentId here
        }
    });
  };

  const filteredPosts = posts.filter(post => {
    const isReply = !!(post.repostOf ? post.repostOf.parentThread : post.parentThread);
    if (activeTab === 'posts') return !isReply;
    if (activeTab === 'replies') return isReply;
    return false;
  });

  const displayList = activeTab === 'likes' ? likedPosts : activeTab === 'archived' ? archivedPosts : filteredPosts;

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleOpenFollowers = () => {
    setFollowListType('followers');
    setIsFollowListOpen(true);
  };

  const handleOpenFollowing = () => {
    setFollowListType('following');
    setIsFollowListOpen(true);
  };

  if (loading && !profile) {
    return (
      <div className="w-full flex flex-col gap-[2px] mb-20">
        <div className="animate-pulse">
          <div className="h-60 bg-muted rounded-t-3xl" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </div>
        <PostSkeleton />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-16 h-16" />}
        title="Unable to load profile"
        description={error || "This profile could not be found."}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Profile Header & Banner */}
        <div className="relative flex flex-col items-center px-4">
          <div className="h-48 sm:h-52 md:h-60 w-full relative group overflow-hidden">
            <div className="w-full h-full relative rounded-t-[2.5rem] overflow-hidden border border-border/50 border-b-0">
              <UserBanner user={profile} />
            </div>
          </div>
          
          {/* Profile Details Card */}
          <div className="w-full pb-4">
            <div className="bg-card/50 backdrop-blur-sm rounded-b-[2.5rem] border border-border/50 border-t-0 p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative z-10 transition-all hover:bg-card">
              {/* Header: Avatar on left, Follow/Edit button on right */}
              <div className="flex justify-between items-end">
                <div className="relative -mt-16 sm:-mt-20">
                  <UserAvatar
                    user={profile}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-card shadow-xl object-cover bg-card"
                  />
                </div>
                
                <div className="pb-2">
                  {isOwnProfile ? (
                    <Button 
                      variant="outline" 
                      className="rounded-full font-bold border-2 px-6 py-2 hover:bg-muted/50 transition-all active:scale-95"
                      onClick={handleEditProfile}
                    >
                      Edit profile
                    </Button>
                  ) : (
                    <Button 
                      className={cn(
                        "rounded-full font-bold px-8 py-2 transition-all active:scale-95 shadow-md hover:shadow-lg",
                        isFollowing ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground" : 
                        profile?.followStatus === 'PENDING' ? "bg-muted/50 text-muted-foreground border-2 border-border/50 hover:bg-destructive hover:text-destructive-foreground" :
                        (isAuthenticated && profile?.followsMe) ? "bg-primary text-primary-foreground" :
                        "bg-primary text-primary-foreground"
                      )}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Unfollow' : 
                       profile?.followStatus === 'PENDING' ? 'Requested' : 
                       (isAuthenticated && profile?.followsMe) ? 'Follow back' : 'Follow'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground">{profile.firstName} {profile.lastName}</h1>
                  <div className="flex flex-col">
                    <p className="text-primary font-bold">{profile.handle}</p>
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-base text-foreground/90 leading-relaxed max-w-2xl bg-muted/60 p-4 rounded-2xl border border-border/10 !mt-2">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground text-sm font-medium">
                  {profile.location && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-full border border-border/10">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-full border border-border/10">
                      <LinkIcon className="w-4 h-4 text-primary/70" />
                      <a 
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {profile.birthday && profile.showBirthday && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-full border border-border/10">
                      <Cake className="w-4 h-4 text-primary/70" />
                      <span>Born {new Date(profile.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  {profile.createdAt && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-full border border-border/10">
                      <Calendar className="w-4 h-4 text-primary/70" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
                
                {/* Stats counts: Following & Followers */}
                <div className="flex gap-8 pt-2">
                  <button 
                    onClick={handleOpenFollowing}
                    className="hover:bg-primary/5 px-4 py-2 -mx-4 rounded-xl transition-all group flex items-center gap-2"
                  >
                    <span className="text-xl font-black text-foreground">{Math.max(0, profile.followingCount || 0)}</span> 
                    <span className="text-muted-foreground font-medium group-hover:text-primary transition-colors">Following</span>
                  </button>
                  <button 
                    onClick={handleOpenFollowers}
                    className="hover:bg-primary/5 px-4 py-2 -mx-4 rounded-xl transition-all group flex items-center gap-2"
                  >
                    <span className="text-xl font-black text-foreground">{Math.max(0, profile.followersCount || 0)}</span> 
                    <span className="text-muted-foreground font-medium group-hover:text-primary transition-colors">Followers</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation (Centered Pill) */}
        <div className="flex items-center justify-center border-b border-border/50 mt-8 mb-4 sticky top-[64px] bg-background/80 backdrop-blur-xl z-20 px-4">
          <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-full border border-border/10 my-2 shadow-inner">
            {(isOwnProfile ? ['posts', 'replies', 'archived', 'likes'] : ['posts', 'replies', 'likes']).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 capitalize min-w-[100px]",
                  activeTab === tab 
                    ? "bg-card text-primary shadow-md ring-1 ring-border/50 scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Content: List of Posts */}
        <div className="flex flex-col items-center gap-[12px] mt-6 pb-20">
          {profile.isPrivateView ? (
            <div className="w-full max-w-2xl px-4">
              <div className="flex flex-col items-center justify-center py-24 bg-card/30 rounded-[2.5rem] border border-dashed border-border/60 text-center backdrop-blur-sm">
                 <Lock className="w-16 h-16 text-muted-foreground/40 mb-6" />
                 <h3 className="text-2xl font-black">These posts are protected</h3>
                  <p className="text-muted-foreground/80 font-medium mt-2">Only approved followers can see {profile.firstName}'s posts.</p>
              </div>
            </div>
          ) : (loadingLikes && activeTab === 'likes') || (loadingArchived && activeTab === 'archived') ? (
            <div className="w-full max-w-2xl">
              <PostSkeleton />
            </div>
          ) : displayList.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title={`No ${activeTab} yet`}
              description={isOwnProfile ? "Nothing to show here." : "This user hasn't content here yet."}
            />
          ) : (
            displayList.map(post => {
              const isRepost = !!post.repostOf;
              const displayPost = isRepost ? post.repostOf : post;
              return (
                <div key={post._id || post.id} className="w-full max-w-2xl">
                  <SocialCard 
                    id={isOwnProfile ? (post._id || post.id) : (displayPost._id || displayPost.id)}
                    className="mx-0" // Remove relative margins as wrapper handles centering
                    author={{
                      _id: displayPost.author?._id || displayPost.author?.id,
                      name: `${displayPost.author?.firstName || ''} ${displayPost.author?.lastName || ''}`.trim() || 'Unknown',
                      avatar: displayPost.author?.avatar || DEFAULT_AVATAR,
                      timeAgo: displayPost.createdAt ? formatRelativeTime(displayPost.createdAt) : 'Just now',
                    }}
                    content={{
                      text: displayPost.content || displayPost.text || '',
                      media: displayPost.media ? (Array.isArray(displayPost.media) ? displayPost.media : [displayPost.media]) : [],
                    }}
                    engagement={{
                      likes: displayPost.likeCount || 0,
                      comments: displayPost.commentCount || 0,
                      shares: displayPost.repostCount || 0,
                      isLiked: displayPost.isLiked || false,
                      isBookmarked: displayPost.isBookmarked || false,
                    }}
                    repostedBy={isRepost ? post.author : null}
                    permissions={isOwnProfile ? post.permissions : displayPost.permissions}
                    onLike={() => handleLike(displayPost._id || displayPost.id, displayPost.isLiked)}
                    onComment={() => handleAction(displayPost._id || displayPost.id, 'commented')}
                    onShare={() => handleAction(displayPost._id || displayPost.id, 'shared')}
                    onBookmark={() => handleAction(displayPost._id || displayPost.id, 'bookmarked')}
                    isArchived={activeTab === 'archived' || post.isArchived}
                    onMore={(action) => handleAction(
                      isOwnProfile ? (post._id || post.id) : (displayPost._id || displayPost.id), 
                      action, 
                      isOwnProfile ? (post.author?._id || post.author) : (displayPost.author?._id || displayPost.author)
                    )}
                  >
                      <PostComments 
                          postId={displayPost._id || displayPost.id} 
                          newComment={recentComments[displayPost._id || displayPost.id]}
                          updatedComment={updatedComment}
                          deletedCommentId={justDeletedCommentId}
                          onReply={(comment) => handleAction(comment._id, 'commented', comment)}
                          onCommentEdit={(comment) => handleAction(null, 'edit_comment', comment)}
                          onCommentDelete={(id) => handleAction(id, 'delete_comment')}
                       />
                  </SocialCard>
                </div>
              );
            })
          )}
          
          {activeTab === 'posts' && (
            <div ref={observerRef} className="h-20 w-full flex items-center justify-center">
               {hasMore && (
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
               )}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchProfileAndPosts}
      />
      
      <EditPostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSuccess={(updatedPost) => {
            // Update local state
            const updateList = (list) => list.map(p => {
                if ((p._id || p.id) === (updatedPost._id || updatedPost.id)) return updatedPost;
                if (p.repostOf && (p.repostOf._id || p.repostOf.id) === (updatedPost._id || updatedPost.id)) {
                    return { ...p, repostOf: updatedPost };
                }
                return p;
            });
            setPosts(prev => updateList(prev));
            setLikedPosts(prev => updateList(prev));
            setArchivedPosts(prev => updateList(prev));
        }}
      />

      <DeleteAlertModal 
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={async () => {
             const postId = deletingPostId;
             try {
                await postService.deletePost(postId);
                setPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
                setLikedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
                setArchivedPosts(prev => prev.filter(p => (p._id || p.id) !== postId));

                if (isOwnProfile) {
                  setProfile(prev => ({ ...prev, postsCount: Math.max(0, (prev.postsCount || 0) - 1) }));
                }
             } catch (err) {
                 console.error("Failed to delete post", err);
             } finally {
                 setDeletingPostId(null);
             }
        }}
      />
      
      <CommentDialog 
        open={!!replyingTo} 
        onOpenChange={(open) => !open && setReplyingTo(null)}
        onSubmit={handleReplySubmit}
        loading={replying}
        title={replyingTo?.type === 'comment' ? "Reply to comment" : "Reply to post"}
        initialContent={replyingTo?.mentionName ? `@${replyingTo.mentionName} ` : ""}
      />

      <CommentDialog 
        open={!!editingComment} 
        onOpenChange={(open) => !open && setEditingComment(null)}
        onSubmit={handleCommentEditSubmit}
        loading={replying}
        title="Edit Comment"
        initialContent={editingComment?.content || ""}
      />

      <DeleteAlertModal 
        isOpen={!!deletingCommentId}
        onClose={() => setDeletingCommentId(null)}
        onConfirm={handleCommentDelete}
        loading={replying}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
      />

      <FollowListModal 
        isOpen={isFollowListOpen}
        onClose={() => setIsFollowListOpen(false)}
        userId={id === 'me' ? (currentUser?._id || currentUser?.id) : id}
        type={followListType}
        title={followListType === 'followers' ? 'Followers' : 'Following'}
      />
    </>
  );
}


