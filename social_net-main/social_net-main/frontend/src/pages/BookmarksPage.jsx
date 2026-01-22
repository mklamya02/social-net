import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, MessageSquare } from 'lucide-react';
import { SocialCard } from '@/components/ui/social-card';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchBookmarkedPosts, likePost, unlikePost, bookmarkPost, addComment, deletePost, archivePost, clearPosts } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { PostComments } from '@/components/feed/PostComments';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { cn, formatRelativeTime } from '@/lib/utils';

export function BookmarksPage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { posts, loading, error } = useSelector(state => state.posts);
  
  // State for comments
  const [activeCommentId, setActiveCommentId] = React.useState(null);
  const [replying, setReplying] = React.useState(false);
  const [recentComments, setRecentComments] = React.useState({});

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(clearPosts());
      dispatch(fetchBookmarkedPosts({ page: 1, limit: 20 }));
    }
  }, [dispatch, isAuthenticated]);

  const handleLike = (postId, isLiked) => {
    requireAuth(() => {
      if (isLiked) {
        dispatch(unlikePost(postId));
      } else {
        dispatch(likePost(postId));
      }
    }, 'login');
  };

  const handleAction = (id, action, authorId) => {
    requireAuth(async () => {
      if (action === 'commented') {
         setActiveCommentId(id);
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
      } else if (action === 'delete') {
         dispatch(deletePost(id));
      } else if (action === 'archive') {
         dispatch(archivePost(id));
      } else if (action === 'follow') {
         await followerService.followUser(authorId);
         dispatch(fetchBookmarkedPosts({ page: 1, limit: 20 }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(authorId);
         dispatch(fetchBookmarkedPosts({ page: 1, limit: 20 }));
      } else if (action === 'report') {
         // console.log(`Reported post ${id}`);
      }
      // console.log(`Post ${id}: ${action}`);
    }, 'login');
  };

  const handleReplySubmit = async (content) => {
      if (!activeCommentId) return;
      setReplying(true);
      try {
          const resultAction = await dispatch(addComment({ postId: activeCommentId, content }));
          if (addComment.fulfilled.match(resultAction)) {
             const { comment } = resultAction.payload;
             setRecentComments(prev => ({
                 ...prev,
                 [activeCommentId]: comment
             }));
          }
          setActiveCommentId(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };


  if (loading && posts.length === 0) {
    return (
      <div className="w-full py-6 px-0 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
                      <Bookmark className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Bookmarks</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70">
                          Loading your bookmarks...
                      </p>
                  </div>
              </div>
          </div>
          <div className="px-6 space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
      </div>
    );
  }

  if (error) {
      return (
        <div className="w-full py-6 px-0 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
                      <Bookmark className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Bookmarks</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70 text-red-500">
                          Failed to load saved posts
                      </p>
                  </div>
              </div>
          </div>
          <div className="px-6">
            <div className="rounded-3xl border border-border/40 bg-card/30 p-12 flex flex-col items-center text-center">
                <div className="p-4 bg-red-500/10 rounded-full mb-4">
                    <Bookmark className="w-12 h-12 text-red-500 opacity-20" />
                </div>
                <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                <p className="text-muted-foreground max-w-xs">{error || "We couldn't load your bookmarks right now."}</p>
            </div>
          </div>
        </div>
      )
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="w-full py-6 px-0 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
                      <Bookmark className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Bookmarks</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70">
                          0 saved posts
                      </p>
                  </div>
              </div>
          </div>

          <div className="px-6">
            <div className="rounded-3xl border border-border/40 bg-card/30 p-12 flex flex-col items-center text-center backdrop-blur-sm">
                <div className="p-6 bg-primary/5 rounded-full mb-6">
                    <Bookmark className="w-16 h-16 text-primary stroke-1 opacity-40 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black mb-3">Save posts for later</h2>
                <p className="text-muted-foreground max-w-sm text-base font-medium leading-relaxed">
                    Bookmark posts to easily find them again in the future. They'll be private to you.
                </p>
            </div>
          </div>
      </div>
    );
  }

  return (
      <div className="w-full py-6 px-0 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
                      <Bookmark className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Bookmarks</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70">
                          {posts.length} saved posts
                      </p>
                  </div>
              </div>
          </div>

          <div className="px-6 space-y-8">
              <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Saved Collections</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                  {posts.map(post => (
                    <div key={post._id || post.id} className="w-full">
                      <SocialCard
                        id={post._id || post.id}
                        className="mx-0 shadow-sm" // mx-0 because parent container has px-6
                        author={{
                    _id: post.author?._id || post.author?.id,
                    name: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown',
                    avatar: post.author?.avatar || DEFAULT_AVATAR,
                    timeAgo: post.createdAt ? formatRelativeTime(post.createdAt) : 'Just now',
                  }}
                        content={{
                          text: post.content || '',
                          media: post.media ? (Array.isArray(post.media) ? post.media : [post.media]) : [],
                          link: post.link,
                        }}
                        engagement={{
                          likes: post.likeCount || 0,
                          comments: post.commentCount || 0,
                          shares: post.repostCount || 0,
                          isLiked: post.isLiked || false,
                          isBookmarked: post.isBookmarked ?? true,
                        }}
                        permissions={post.permissions}
                        onLike={() => handleLike(post._id || post.id, post.isLiked)}
                        onComment={() => handleAction(post._id || post.id, 'commented')}
                        onShare={() => handleAction(post._id || post.id, 'shared')}
                        onBookmark={() => handleAction(post._id || post.id, 'bookmarked')}
                        onMore={(action) => handleAction(post._id || post.id, action, post.author?._id)}
                      >
                           <PostComments 
                              postId={post._id || post.id} 
                              newComment={recentComments[post._id || post.id]}
                           />
                      </SocialCard>
                    </div>
                  ))}
                  </div>
              </section>
          </div>

        <CommentDialog 
            open={!!activeCommentId} 
            onOpenChange={(open) => !open && setActiveCommentId(null)}
            onSubmit={handleReplySubmit}
            loading={replying}
        />
      </div>
  );
}
