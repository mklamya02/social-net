import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SocialCard } from '@/components/ui/social-card';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostSkeleton } from '@/components/ui/PostSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchPosts, createPost, likePost, unlikePost, addComment, bookmarkPost, deletePost, archivePost, clearPosts } from '@/store/slices/postSlice';
import { followerService } from '@/services/follower.service';
import { postService } from '@/services/post.service';
import { MessageSquare, LayoutGrid, Users } from 'lucide-react';
import { CommentDialog } from '@/components/feed/CommentDialog';
import { setFeedMode } from '@/store/slices/uiSlice';
import { cn, formatRelativeTime } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { PostComments } from '@/components/feed/PostComments';
import { EditPostModal } from '@/components/modals/EditPostModal';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';



export default function Feed() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { feedMode } = useSelector(state => state.ui);
  const { posts, loading, error, hasMore, currentPage } = useSelector(state => state.posts);
  
  const [recentComments, setRecentComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [updatedComment, setUpdatedComment] = useState(null);
  const [justDeletedCommentId, setJustDeletedCommentId] = useState(null);
  const [replying, setReplying] = useState(false);

  const { isAuthenticated } = useSelector(state => state.auth);
  
  const loadMore = () => {
    if (hasMore && !loading) {
      dispatch(fetchPosts({ 
        page: currentPage + 1, 
        limit: 5, 
        mode: feedMode === 'public' ? 'discover' : 'following' 
      }));
    }
  };

  const { observerRef } = useInfiniteScroll(loadMore, hasMore, loading);
  
  // Fetch posts on mount and when feedMode or auth status changes
  useEffect(() => {
    dispatch(clearPosts()); // Clear old posts instantly to avoid flickering/phantom feed
    dispatch(fetchPosts({ 
      page: 1, 
      limit: 5, 
      mode: feedMode === 'public' ? 'discover' : 'following' 
    }));
  }, [dispatch, feedMode, isAuthenticated]);

  const handleNewPost = (data) => {
    return requireAuth(() => {
      return dispatch(createPost(data));
    }, 'login');
  };

  const handleFeedModeChange = (mode) => {
    dispatch(setFeedMode(mode));
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
         // payload is the comment object
         if (typeof payload === 'object' && payload.thread) { // It's a comment
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
         dispatch(fetchPosts({ page: 1, limit: 5, mode: feedMode === 'public' ? 'discover' : 'following' }));
      } else if (action === 'unfollow') {
         await followerService.unfollowUser(payload);
         dispatch(fetchPosts({ page: 1, limit: 5, mode: feedMode === 'public' ? 'discover' : 'following' }));
      } else if (action === 'edit_comment') {
          setEditingComment(payload);
      } else if (action === 'delete_comment') {
          setDeletingCommentId(id);
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
                 [threadId]: comment // Key by threadId to update correct PostComments
             }));
          }
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

  const filteredPosts = posts;

  return (
    <div className="space-y-0 mt-0">
      {/* Feed Container */}
      <div className="flex flex-col gap-[2px]">
        <div className="px-0 py-6">
          <CreatePost onPost={handleNewPost} />
        </div>

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
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-16 h-16" />}
            title={feedMode === 'following' ? "No posts from people you follow" : "No posts yet"}
            description={
              feedMode === 'following'
                ? "Follow some users to see their posts here."
                : "Be the first to create a post!"
            }
          />
        ) : (
          <>
            {filteredPosts.map(post => {
              const isRepost = !!post.repostOf;
              const displayPost = isRepost ? post.repostOf : post;
              
              // Formatting author avatar for displayPost if it was populated but not formatted
              
              
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
                    avatar: displayPost.author?.avatar || DEFAULT_AVATAR,
                    timeAgo: displayPost.createdAt ? formatRelativeTime(displayPost.createdAt) : 'Just now',
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
                        updatedComment={updatedComment}
                        deletedCommentId={justDeletedCommentId}
                        onReply={(comment) => handleAction(comment._id, 'commented', comment)}
                        onCommentEdit={(comment) => handleAction(null, 'edit_comment', comment)}
                        onCommentDelete={(id) => handleAction(id, 'delete_comment')}
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

      <EditPostModal 
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSuccess={(updatedPost) => {
            // Refresh feed or update local state
            // fetchPosts will refresh everything, or we can assume redux handles it if we dipatch an action? 
            // postService.updatePost returns updated data. We probably want to update Redux store.
            // Ideally we should dispatch an action 'postUpdated'.
            // For now, re-fetching current page or updating list in Redux is needed.
            // Since we don't have updatePost action in slice that takes payload directly to update state (we have async thunk but we called service directly in modal),
            // we can trigger a fetch or just let it be if user refreshes. 
            // Better: Dispatch fetchPosts or make updatePost an async thunk in slice that handles update.
            // But modal handles service call.
            // Let's just refresh feed for simplicity or maybe dispatch an action if available.
            // Actually, we can dispatch fetchPosts to refresh.
            dispatch(fetchPosts({ page: 1, limit: 5, mode: feedMode === 'public' ? 'discover' : 'following' }));
        }}
      />

      <DeleteAlertModal 
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={async () => {
             await dispatch(deletePost(deletingPostId));
             setDeletingPostId(null);
        }}
        loading={status === 'loading'}
      />
    </div>
  );
}
