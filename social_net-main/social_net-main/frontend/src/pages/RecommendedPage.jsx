import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchRecommendedPosts, likePost, unlikePost, addComment, bookmarkPost, deletePost, archivePost, clearPosts } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { Sparkles, MessageSquare, Filter, RefreshCcw } from 'lucide-react';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { cn, formatRelativeTime } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { PostComments } from '@/components/feed/PostComments';
import { EditPostModal } from '@/components/modals/EditPostModal';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';
import { INTEREST_OPTIONS } from '@/constants/interests';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export function RecommendedPage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { posts, loading, error, hasMore, currentPage } = useSelector(state => state.posts);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  const [recentComments, setRecentComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [replying, setReplying] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Pick up topic from URL if present (e.g., /recommended?topic=tech)
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic && topic !== selectedInterest) {
      setSelectedInterest(topic);
    }
  }, [searchParams]);

  const loadMore = () => {
    if (hasMore && !loading) {
      dispatch(fetchRecommendedPosts({ page: currentPage + 1, limit: 5, tags: selectedInterest }));
    }
  };

  const { observerRef } = useInfiniteScroll(loadMore, hasMore, loading);

  // Fetch recommended posts on mount and when filter changes
  useEffect(() => {
    dispatch(clearPosts());
    if (isAuthenticated) {
      dispatch(fetchRecommendedPosts({ page: 1, limit: 5, tags: selectedInterest }));
    }
  }, [dispatch, isAuthenticated, selectedInterest]);

  const handleResetFilter = () => {
    setSelectedInterest(null);
  };

  const handleInterestSelect = (interestId) => {
    setSelectedInterest(interestId);
    setFilterOpen(false);
  };

  const handleLike = (postId, isLiked) => {
    requireAuth(() => {
      if (isLiked) {
         dispatch(unlikePost(postId));
      } else {
         dispatch(likePost(postId));
      }
    }, 'login');
  };

  const handleAction = async (id, action, payload) => {
    requireAuth(async () => {
      if (action === 'commented') {
         if (typeof payload === 'object' && payload.thread) {
             setReplyingTo({ 
                 id: id, 
                 type: 'comment', 
                 threadId: payload.thread,
                 mentionName: `${payload.author?.firstName || ''} ${payload.author?.lastName || ''}`.trim()
             });
         } else {
             setReplyingTo({ id: id, type: 'post', threadId: id });
         }
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
      } else if (action === 'delete') {
         setDeletingPostId(id);
      } else if (action === 'edit') {
         const post = posts.find(p => (p._id || p.id) === id);
         setEditingPost(post);
      } else if (action === 'archive') {
         dispatch(archivePost(id));
      } else if (action === 'follow') {
         await followerService.followUser(payload);
         dispatch(fetchRecommendedPosts({ page: 1, limit: 5, tags: selectedInterest }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(payload);
         dispatch(fetchRecommendedPosts({ page: 1, limit: 5, tags: selectedInterest }));
      }
    }, 'login');
  };

  const handleReplySubmit = async (content) => {
      if (!replyingTo) return;
      setReplying(true);
      try {
          const { id, type, threadId } = replyingTo;
          const parentCommentId = type === 'comment' ? id : null;
          
          const resultAction = await dispatch(addComment({ 
              postId: threadId, 
              content,
              parentCommentId 
          }));

          if (addComment.fulfilled.match(resultAction)) {
             const { comment } = resultAction.payload;
             setRecentComments(prev => ({
                 ...prev,
                 [threadId]: comment
             }));
          }
          setReplyingTo(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };

  const handleLoadMore = () => {
    loadMore();
  };

  if (!isAuthenticated || !user?.interests || user.interests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Interests Selected</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Select your interests in settings to see personalized recommendations based on hashtags.
        </p>
      </div>
    );
  }

  const activeInterestOption = selectedInterest 
    ? INTEREST_OPTIONS.find(i => i.id === selectedInterest)
    : null;

  const activeInterestLabel = activeInterestOption ? activeInterestOption.label : "For You";
  const activeInterestIcon = activeInterestOption ? activeInterestOption.icon : "✨";

  return (
    <div className="space-y-4 pt-4">
      
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sticky top-0 z-30 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner group transition-all duration-300 hover:scale-110">
              {activeInterestIcon}
           </div>
           <div>
               <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                 {activeInterestLabel}
                 {selectedInterest && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
               </h1>
               <p className="text-[13px] font-medium text-muted-foreground/70">
                   {selectedInterest ? `Browsing ${activeInterestLabel} topics` : 'Personalized based on your interests'}
               </p>
           </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
             <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                   <Button 
                     variant="outline" 
                     className={cn(
                       "rounded-2xl gap-2 h-11 px-5 border-border/50 transition-all duration-300 flex-1 sm:flex-initial",
                       selectedInterest ? "bg-primary/5 border-primary/30 text-primary" : "hover:bg-muted"
                     )}
                   >
                       <Filter className={cn("w-4 h-4", selectedInterest ? "text-primary" : "text-muted-foreground")} />
                       <span className="font-bold text-sm">Filter Topics</span>
                   </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-4 w-[95vw] sm:w-[540px] md:w-[640px] rounded-[2rem] shadow-2xl border-border/40 backdrop-blur-3xl bg-card/95 animate-in fade-in-0 zoom-in-95 duration-300" 
                  align="end"
                  sideOffset={8}
                >
                    <div className="mb-4 px-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Explore Interests</span>
                      {selectedInterest && (
                        <button 
                          onClick={handleResetFilter}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <RefreshCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
                        {INTEREST_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => handleInterestSelect(option.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 gap-1.5 group relative overflow-hidden",
                                    selectedInterest === option.id 
                                      ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20 shadow-md transform scale-[0.98]" 
                                      : "bg-muted/30 border-transparent hover:bg-muted hover:border-border/50 text-muted-foreground hover:text-foreground hover:scale-[1.02]"
                                )}
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{option.icon}</span>
                                <span className="text-[11px] font-black tracking-tight text-center leading-tight">{option.label}</span>
                                {selectedInterest === option.id && (
                                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
             </Popover>
             
             {selectedInterest && (
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleResetFilter}
                    className="rounded-xl w-11 h-11 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    title="Reset to For You"
                 >
                     <RefreshCcw className="w-4 h-4" />
                 </Button>
             )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
      
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : error && posts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16" />}
            title="Unable to load posts"
            description={error || "There was an error loading the feed. Please try again later."}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={selectedInterest ? <Filter className="w-16 h-16 opacity-20" /> : <Sparkles className="w-16 h-16 opacity-20" />}
            title={selectedInterest ? `No ${activeInterestLabel} posts yet` : "No Recommended Posts Yet"}
            description={selectedInterest ? "We couldn't find any recent posts for this topic. Be the first to post something!" : "We couldn't find posts matching your interests. Try following more users or check back later!"}
            action={selectedInterest ? (
                <Button onClick={handleResetFilter} variant="outline" className="mt-4 rounded-full border-primary/30 text-primary hover:bg-primary/5">
                    View Personalized Feed
                </Button>
            ) : null}
          />
        ) : (
          <>
            {posts.map(post => {
              const isRepost = !!post.repostOf;
              const displayPost = isRepost ? post.repostOf : post;
              
              return (
                <SocialCard
                  key={post._id || post.id}
                  id={post._id || post.id}
                  repostedBy={isRepost ? {
                    name: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown'
                  } : null}
                  author={{
                    _id: displayPost.author?._id || displayPost.author?.id,
                    name: `${displayPost.author?.firstName || ''} ${displayPost.author?.lastName || ''}`.trim() || 'Unknown',
                    avatar: displayPost.author?.avatar?.url || displayPost.author?.avatar || DEFAULT_AVATAR,
                    timeAgo: displayPost.createdAt ? formatRelativeTime(displayPost.createdAt) : 'Just now',
                    handle: displayPost.author?.handle,
                  }}
                  content={{
                    text: displayPost.content || displayPost.text || '',
                    media: displayPost.media ? (Array.isArray(displayPost.media) ? displayPost.media : [displayPost.media]) : [],
                    link: displayPost.link,
                  }}
                  engagement={{
                    likes: displayPost.likeCount || 0,
                    comments: displayPost.commentCount || 0,
                    shares: displayPost.repostCount || 0,
                    isLiked: displayPost.isLiked || false,
                    isBookmarked: displayPost.isBookmarked || false,
                  }}
                  permissions={displayPost.permissions}
                  onLike={() => handleLike(displayPost._id || displayPost.id, displayPost.isLiked)}
                  onComment={() => handleAction(displayPost._id || displayPost.id, 'commented')}
                  onShare={() => handleAction(displayPost._id || displayPost.id, 'shared')}
                  onBookmark={() => handleAction(displayPost._id || displayPost.id, 'bookmarked')}
                  onMore={(action) => handleAction(displayPost._id || displayPost.id, action, displayPost.author?._id)}
                >
                     <PostComments 
                        postId={displayPost._id || displayPost.id} 
                        newComment={recentComments[displayPost._id || displayPost.id]}
                        onReply={(comment) => handleAction(comment._id, 'commented', comment)}
                     />
                </SocialCard>
              );
            })}
            {/* Sentinel and Loading Indicator */}
            <div ref={observerRef} className="h-20 w-full flex items-center justify-center">
               {hasMore && (
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
               )}
            </div>
          </>
        )}
      </div>

      <CommentDialog 
        open={!!replyingTo} 
        onOpenChange={(open) => !open && setReplyingTo(null)}
        onSubmit={handleReplySubmit}
        loading={replying}
        title={replyingTo?.type === 'comment' ? "Reply to comment" : "Reply to post"}
        initialContent={replyingTo?.mentionName ? `@${replyingTo.mentionName} ` : ""}
      />

      <EditPostModal 
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSuccess={() => {
            dispatch(fetchRecommendedPosts({ page: 1, limit: 5, tags: selectedInterest }));
        }}
      />

      <DeleteAlertModal 
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={async () => {
             await dispatch(deletePost(deletingPostId));
             setDeletingPostId(null);
        }}
        loading={loading}
      />
    </div>
  );
}
