import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Archive } from 'lucide-react';
import { SocialCard } from '@/components/ui/social-card';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditPostModal } from '@/components/modals/EditPostModal';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';
import { likePost, unlikePost, bookmarkPost, addComment } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { PostComments } from '@/components/feed/PostComments';
import { postService } from '@/services/post.service';
import { DEFAULT_AVATAR } from '@/lib/constants';

export function ArchivedPostsPage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activeCommentId, setActiveCommentId] = React.useState(null);
  const [replying, setReplying] = React.useState(false);
  const [recentComments, setRecentComments] = React.useState({});
  const [editingPost, setEditingPost] = React.useState(null);
  const [deletingPostId, setDeletingPostId] = React.useState(null);

  useEffect(() => {
    const fetchArchivedPosts = async () => {
      try {
        setLoading(true);
        const response = await postService.getArchivedPosts(1, 20);
        setPosts(response.threads || []);
      } catch (err) {
        setError(err.message || 'Failed to load archived posts');
      } finally {
        setLoading(false);
      }
    };
    fetchArchivedPosts();
  }, []);

  const handleLike = (postId, isLiked) => {
    requireAuth(() => {
      if (isLiked) {
        dispatch(unlikePost(postId));
      } else {
        dispatch(likePost(postId));
      }
    }, 'login');
  };

  const handleAction = async (id, action, authorId) => {
    requireAuth(async () => {
      if (action === 'commented') {
         setActiveCommentId(id);
      } else if (action === 'bookmarked') {
         dispatch(bookmarkPost(id));
      } else if (action === 'delete') {
         setDeletingPostId(id);
      } else if (action === 'unarchive') {
         await postService.unarchivePost(id);
         setPosts(posts.filter(p => p._id !== id));
      } else if (action === 'edit') {
         const post = posts.find(p => (p._id || p.id) === id);
         setEditingPost(post);
      } else if (action === 'follow') {
         await followerService.followUser(authorId);
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(authorId);
      }
    }, 'login');
  };

  const handleReplySubmit = async (content) => {
      if (!activeCommentId) return;
      setReplying(true);
      try {
          const resultAction = await dispatch(addComment({ postId: activeCommentId, content }));
          if (addComment.fulfilled.match(resultAction)) {
             const { comment } = resultAction.payload;
             setRecentComments(prev => ({ ...prev, [activeCommentId]: comment }));
          }
          setActiveCommentId(null);
      } catch (error) {
          console.error("Failed to reply", error);
      } finally {
          setReplying(false);
      }
  };

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) return `${interval}${unit[0]}`;
    }
    return 'Just now';
  }

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
            <h1 className="text-xl font-bold">Archived Posts</h1>
            <p className="text-sm text-muted-foreground">Your archived posts</p>
        </div>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error) {
      return (
        <div className="max-w-2xl mx-auto">
             <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4 mb-6">
                <h1 className="text-xl font-bold">Archived Posts</h1>
                <p className="text-sm text-muted-foreground">Your archived posts</p>
            </div>
            <EmptyState icon={<Archive className="w-16 h-16" />} title="Unable to load archived posts" description={error || "Please try again later."} />
        </div>
      )
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
              <h1 className="text-xl font-bold">Archived Posts</h1>
              <p className="text-sm text-muted-foreground">Your archived posts</p>
          </div>
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground mt-10">
              <div className="bg-muted/50 p-6 rounded-full mb-4">
                  <Archive className="w-12 h-12 stroke-1" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No archived posts</h2>
              <p className="max-w-sm">Posts you archive will appear here.</p>
          </div>
      </div>
    );
  }

  return (
      <div className="max-w-2xl mx-auto space-y-6 mb-20">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4">
              <h1 className="text-xl font-bold">Archived Posts</h1>
              <p className="text-sm text-muted-foreground">{posts.length} archived posts</p>
          </div>
          {posts.map(post => (
            <SocialCard key={post._id || post.id} id={post._id || post.id}
                  author={{
                    _id: post.author?._id || post.author?.id,
                    name: `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim() || 'Unknown',
                    avatar: post.author?.avatar || DEFAULT_AVATAR,
                    timeAgo: post.createdAt ? formatRelativeTime(post.createdAt) : 'Just now',
                  }}
              content={{ text: post.content || '', media: post.media ? (Array.isArray(post.media) ? post.media : [post.media]) : [], link: post.link }}
              engagement={{ likes: post.likeCount || 0, comments: post.commentCount || 0, shares: post.repostCount || 0, isLiked: post.isLiked || false, isBookmarked: post.isBookmarked || false }}
              permissions={post.permissions}
              onLike={() => handleLike(post._id || post.id, post.isLiked)}
              onComment={() => handleAction(post._id || post.id, 'commented')}
              onShare={() => handleAction(post._id || post.id, 'shared')}
              onBookmark={() => handleAction(post._id || post.id, 'bookmarked')}
              onMore={(action) => handleAction(post._id || post.id, action, post.author?._id)}
              isArchived={true}
            >
                 <PostComments postId={post._id || post.id} newComment={recentComments[post._id || post.id]} />
            </SocialCard>
          ))}
        <CommentDialog open={!!activeCommentId} onOpenChange={(open) => !open && setActiveCommentId(null)} onSubmit={handleReplySubmit} loading={replying} />
      
        <EditPostModal
            isOpen={!!editingPost}
            onClose={() => setEditingPost(null)}
            post={editingPost}
            onSuccess={(updatedPost) => {
                setPosts(prev => prev.map(p => (p._id || p.id) === (updatedPost._id || updatedPost.id) ? updatedPost : p));
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
                } catch (err) {
                    console.error("Failed to delete post", err);
                } finally {
                    setDeletingPostId(null);
                }
            }}
        />
      </div>
  );
}
