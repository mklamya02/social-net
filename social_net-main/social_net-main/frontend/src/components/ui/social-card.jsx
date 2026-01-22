import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link2, Flag, Archive, Trash2, Copy, Check, UserPlus, UserMinus, Edit3, ArchiveRestore } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function SocialCard({
  id,
  author,
  content,
  engagement,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore,
  className,
  children,
  repostedBy, // New prop: { name, username }
  permissions, // New prop: { isOwner, isFollowingAuthor, canFollow, canDelete, etc. }
  isArchived = false // New prop to determine archive status
}) {
  const requireAuth = useAuthGuard();
  const [isLiked, setIsLiked] = useState(engagement?.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(engagement?.isBookmarked ?? false);
  const [likes, setLikes] = useState(engagement?.likes ?? 0);
  const [copied, setCopied] = useState(false);

  // Sync state with props when data is re-fetched
  useEffect(() => {
    setIsLiked(engagement?.isLiked ?? false);
    setLikes(engagement?.likes ?? 0);
    setIsBookmarked(engagement?.isBookmarked ?? false);
  }, [engagement?.isLiked, engagement?.likes, engagement?.isBookmarked]);

  const handleLike = () => {
    requireAuth(() => {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      onLike?.();
    });
  };
  
  const handleComment = () => {
    requireAuth(() => {
      onComment?.();
    });
  };
  
  const handleShare = () => {
    requireAuth(() => {
      onShare?.();
    });
  };
  
  const handleBookmark = () => {
    requireAuth(() => {
      setIsBookmarked(!isBookmarked);
      onBookmark?.();
    });
  };

  const handleCopyLink = () => {
    const postLink = `${window.location.origin}/post/${id || engagement?.id || author?.username}`;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "mx-2 md:mx-4",
        "bg-card text-card-foreground",
        "border border-border/50 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]",
        "rounded-2xl overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col">
        <div className="p-4 sm:p-5">
          {/* Repost Header */}
          {repostedBy && (
            <div className="flex items-center gap-2 mb-3 px-1 text-xs font-semibold text-muted-foreground">
              <Share2 className="w-3 h-3" />
              <span>{repostedBy.name} reposted</span>
            </div>
          )}

          {/* Author section */}
          <div className="flex items-center justify-between mb-5">
            <Link to={`/profile/${author?._id || author?.id}`} className="flex items-center gap-4 group/author">
              <div className="relative">
                <UserAvatar
                  user={author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm transition-transform group-hover/author:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-foreground leading-tight group-hover/author:text-primary transition-colors">
                  {author?.name}
                </h3>
                {author?.handle && <p className="text-primary text-[10px] font-bold leading-none -mt-0.5">{author.handle}</p>}
                <p className="text-sm text-muted-foreground/80 leading-tight mt-0.5">
                   <span className="text-xs opacity-70 font-medium">{author?.timeAgo}</span>
                </p>
              </div>
            </Link>
            
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground outline-none"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1.5" align="end">
                <div className="flex flex-col gap-0.5">
                  {/* General Actions */}
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium">{copied ? "Copied!" : "Copy link"}</span>
                  </button>

                  {/* Owner Actions */}
                  {permissions?.isOwner && (
                    <>
                      {permissions.canEdit && (
                        <button 
                          onClick={() => onMore("edit")}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                          <span>Edit post</span>
                        </button>
                      )}
                      <button 
                        onClick={() => onMore(isArchived ? "unarchive" : "archive")}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                      >
                        {isArchived ? <ArchiveRestore className="w-4 h-4 text-muted-foreground" /> : <Archive className="w-4 h-4 text-muted-foreground" />}
                        <span>{isArchived ? "Unarchive" : "Archive"}</span>
                      </button>
                      
                      {permissions.canDelete && (
                        <>
                          <div className="h-px bg-border my-1" />
                          <button 
                            onClick={() => onMore("delete")}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg transition-colors w-full text-left font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete post</span>
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Other User Actions */}
                  {!permissions?.isOwner && permissions && (
                    <>
                      {permissions.canFollow && (
                        <button 
                          onClick={() => requireAuth(() => onMore("follow"))}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                        >
                          <UserPlus className="w-4 h-4 text-primary" />
                          <span>{permissions.followStatus === 'PENDING' ? "Requested" : `Follow ${author?.name}`}</span>
                        </button>
                      )}
                      {permissions.isFollowing && (
                         <button 
                          onClick={() => requireAuth(() => onMore("unfollow"))}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors w-full text-left font-medium"
                         >
                           <UserMinus className="w-4 h-4 text-muted-foreground" />
                           <span>Unfollow {author?.name}</span>
                         </button>
                      )}
                      
                      {permissions.canReport && (
                        <>
                          <div className="h-px bg-border my-1" />
                          <button 
                            onClick={() => {
                              requireAuth(() => {
                                if (window.confirm("Are you sure you want to report this post? Our team will review it.")) {
                                  onMore("report");
                                }
                              });
                            }}
                            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg transition-colors w-full text-left font-medium"
                          >
                            <Flag className="w-4 h-4" />
                            <span>Report post</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Content section */}
          <p className="text-[15px] sm:text-base text-foreground/90 leading-relaxed mb-5 whitespace-pre-wrap">
            {content?.text && content.text.split(/(\s+)/).map((word, index) => {
              if (word.startsWith('#') && word.length > 1) {
                return (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-0.5 my-0.5 mx-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-bold text-[13px] sm:text-sm transition-all duration-300 hover:bg-primary/20 hover:scale-105 cursor-pointer shadow-sm shadow-primary/5"
                  >
                    {word}
                  </span>
                );
              }
              return word;
            })}
          </p>

          {/* Media Attachments */}
          {content?.media && content.media.length > 0 && (
            <div className={cn(
              "grid gap-2 mb-4 rounded-2xl overflow-hidden cursor-pointer",
              content.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
              {content.media.map((item, index) => (
                <div key={index} className="relative aspect-video bg-muted">
                  {(item.mediaType === 'video' || item.type === 'video') ? (
                     <video 
                       controls 
                       playsInline
                       preload="metadata"
                       className="w-full h-full object-cover"
                     >
                       <source src={item.url} type={item.contentType || 'video/mp4'} />
                       Your browser does not support the video tag.
                     </video>
                  ) : (
                    <img 
                      src={item.url} 
                      alt="Post attachment" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Link preview */}
          {content?.link && (
            <div className="mb-4 rounded-2xl border bg-muted/50 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-background rounded-xl">
                    {content.link.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      {content.link.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {content.link.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement section */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/10">
            <div className="flex items-center gap-2 sm:gap-6">
              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all duration-200 group/btn",
                  isLiked
                    ? "text-rose-600 bg-rose-500/10"
                    : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/5"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all group-active/btn:scale-125",
                    isLiked && "fill-current"
                  )}
                />
                <span className="font-semibold">{likes}</span>
              </button>
              
              <button
                type="button"
                onClick={handleComment}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 group/btn active:scale-95"
              >
                <MessageCircle className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                <span className="font-semibold">{engagement?.comments}</span>
              </button>
              
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-green-500 hover:bg-green-500/5 transition-all duration-200 group/btn active:scale-95"
              >
                <Share2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                <span className="font-semibold">{engagement?.shares}</span>
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "p-2.5 rounded-full transition-all duration-200 active:scale-90",
                isBookmarked 
                  ? "text-yellow-500 bg-yellow-500/10" 
                  : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Bookmark className={cn(
                "w-5 h-5 transition-all",
                isBookmarked && "fill-current scale-110"
              )} />
            </button>
          </div>

          {/* Optional Children (Comments) */}
          {children && (
             children
          )}
        </div>
      </div>
    </div>
  );
}
