import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '@/services/post.service';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from "@/lib/utils";
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useSelector } from 'react-redux';

export function PostComments({ postId, newComment, updatedComment, deletedCommentId, onReply, onCommentEdit, onCommentDelete }) {
  const [comments, setComments] = useState([]);
  const currentUser = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Handle new incoming comment (optimistic or actual from parent)
  useEffect(() => {
    if (newComment && String(newComment.thread) === String(postId)) {
      setComments(prev => {
        // Avoid duplicates if necessary, though simple append is usually fine for "new"
        if (prev.find(c => c._id === newComment._id)) return prev;
        return [...prev, newComment];
      });
      setIsExpanded(true); // Automatically expand when a new comment is added
    }
  }, [newComment, postId]);

  // Handle updated comment
  useEffect(() => {
    if (updatedComment && String(updatedComment.thread) === String(postId)) {
        setComments(prev => prev.map(c => 
            c._id === updatedComment._id ? { ...c, ...updatedComment } : c
        ));
    }
  }, [updatedComment, postId]);

  // Handle deleted comment
  useEffect(() => {
    if (deletedCommentId) {
        setComments(prev => prev.filter(c => c._id !== deletedCommentId));
        // Note: Nested replies are just filtered out if parent is deleted?
        // Actually, if parent is deleted, we removed it from list.
        // If a reply logic removed only child, it's fine.
        // If backend deleted children, we might have orphan replies if they are top-level in 'comments' array?
        // Current logic filters all comments related to thread.
        // If 'deleteComment' backend deleted parent + child, we only know about parent ID deletion here.
        // If children are stored as separate items in 'comments' list (they are), they remain until refresh?
        // But render logic `filter(c => !c.parentComment)` would hide top level.
        // But children `replies.filter(...)` would fail if parent is gone.
        // The render loop starts with top-level. If top-level parent is gone, children won't be rendered anyway!
        // So visually they will disappear. Excellent.
    }
  }, [deletedCommentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await postService.getComments(postId, { limit: 10 }); // Fetch more initially but show few
      const { comments: data, pagination } = response;
      
      setComments(data);
      setNextCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore);
      setError(null);
    } catch (err) {
      console.error("Failed to load comments", err);
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor) {
        setIsExpanded(true);
        return;
    }
    try {
      setLoadingMore(true);
      const response = await postService.getComments(postId, { 
        limit: 10, 
        cursor: nextCursor 
      });
      const { comments: newData, pagination } = response;

      setComments(prev => [...prev, ...newData]);
      setNextCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore);
      setIsExpanded(true);
      
    } catch (err) {
      console.error("Failed to load more comments", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLikeCommment = async (commentId, isLiked) => {
    // Optimistic update
    setComments(prev => prev.map(c => {
        if (c._id === commentId) {
            return {
                ...c,
                isLiked: !isLiked,
                likeCount: isLiked ? Math.max(0, (c.likeCount || 0) - 1) : (c.likeCount || 0) + 1
            };
        }
        return c;
    }));

    try {
        if (isLiked) {
            await postService.unlikePost(commentId);
        } else {
            await postService.likePost(commentId);
        }
    } catch (error) {
        // If error is 409 Conflict (Already Liked), we don't need to revert
        // because the goal state (Liked) matches the server state.
        if (error.response && error.response.status === 409) {
             console.warn("Comment was already liked (409 Conflict) - Resyncing UI state");
             return; 
        }

        console.error("Failed to toggle like on comment", error);
        // Revert on failure
        setComments(prev => prev.map(c => {
            if (c._id === commentId) {
                return {
                    ...c,
                    isLiked: isLiked,
                    likeCount: isLiked ? (c.likeCount || 0) + 1 : Math.max(0, (c.likeCount || 0) - 1)
                };
            }
            return c;
        }));
    }
  };

  if (loading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-4 w-4 text-muted-foreground" /></div>;
  }

  if (comments.length === 0 && !error) {
      return null;
  }

  const displayedComments = isExpanded ? comments : comments.slice(0, 3);

  return (
    <div className="border-t border-border p-4 space-y-4">
        {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No replies yet</p>
        ) : (
            <div className="space-y-4">
                {displayedComments.filter(c => !c.parentComment).map(comment => {
                  const replies = comments.filter(c => c.parentComment === comment._id);
                  return (
                    <div key={comment._id} className="space-y-3">
                        <CommentItem 
                            comment={comment} 
                            onReply={onReply} 
                            handleLikeCommment={handleLikeCommment}
                            currentUserId={currentUser?._id || currentUser?.id}
                            onEdit={onCommentEdit}
                            onDelete={onCommentDelete}
                        />
                        {/* Nested Replies */}
                        {replies.length > 0 && (
                            <div className="pl-9 space-y-3 relative">
                                <div className="absolute left-4 top-0 bottom-4 w-[2px] bg-border/40 rounded-full" />
                                {replies.map(reply => (
                                    <CommentItem 
                                        key={reply._id} 
                                        comment={reply} 
                                        onReply={onReply} 
                                        handleLikeCommment={handleLikeCommment}
                                        isReply
                                        currentUserId={currentUser?._id || currentUser?.id}
                                        onEdit={onCommentEdit}
                                        onDelete={onCommentDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                  );
                })}
            </div>
        )}

      <div className="flex items-center gap-4">
        {(hasMore || (comments.length > 3 && !isExpanded)) && (
            <button 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
            >
                {loadingMore ? 'Loading...' : 'See more comments'}
            </button>
        )}
        
        {isExpanded && comments.length > 3 && (
            <button 
                onClick={() => setIsExpanded(false)} 
                className="text-sm text-muted-foreground hover:underline font-medium"
            >
                See less
            </button>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply, handleLikeCommment, isReply, currentUserId, onEdit, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);
    const isOwner = currentUserId === (comment.author?._id || comment.author?.id);

    return (
        <div className="flex gap-3 group/comment-item">
            <Link to={`/profile/${comment.author?._id || comment.author?.id}`} className="shrink-0 group/comment-author relative z-10">
              <UserAvatar 
                  user={comment.author} 
                  className={cn("rounded-full object-cover transition-opacity group-hover/comment-author:opacity-80 outline outline-4 outline-background", isReply ? "w-6 h-6" : "w-8 h-8")}
              />
            </Link>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                        <Link to={`/profile/${comment.author?._id || comment.author?.id}`} className="text-sm font-semibold text-foreground hover:underline">
                          {comment.author?.firstName} {comment.author?.lastName}
                        </Link>
                        <span className="text-xs text-muted-foreground/60">
                            {formatRelativeTime(comment.createdAt)}
                        </span>
                    </div>
                    
                    {/* Three-dot menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-muted rounded-full transition-colors opacity-0 group-hover/comment-item:opacity-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                            </svg>
                        </button>
                        
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                                    {isOwner ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    onEdit && onEdit(comment);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    onDelete && onDelete(comment._id);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-red-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                </svg>
                                                Delete
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                // TODO: Implement report functionality
                                                alert('Report functionality coming soon');
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-orange-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
                                            </svg>
                                            Report
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <p className="text-sm text-foreground/90">
                    {comment.content.split(/(@\w+(?:\s\w+)?)/g).map((part, index) => (
                        part.startsWith('@') ? (
                            <span key={index} className="text-primary font-medium">{part}</span>
                        ) : part
                    ))}
                </p>
                
                {/* Actions */}
                <div className="flex items-center gap-4 pt-1">
                    <button 
                        onClick={() => handleLikeCommment(comment._id, comment.isLiked)}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium transition-colors group/like",
                            comment.isLiked ? "text-red-500" : "text-muted-foreground/60 hover:text-red-500"
                        )}
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill={comment.isLiked ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="transition-transform group-active/like:scale-75"
                        >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                        {comment.likeCount > 0 && (
                            <span>{comment.likeCount}</span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => onReply && onReply(comment)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 hover:text-primary transition-colors group/reply"
                    >
                        <span className="hover:underline">Reply</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
