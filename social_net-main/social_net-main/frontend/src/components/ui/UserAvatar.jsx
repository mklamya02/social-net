import React from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { DEFAULT_AVATAR } from "@/lib/constants";

/**
 * UserAvatar component that automatically uses the latest current user avatar
 * from Redux if the provided user object matches the current user.
 */
export function UserAvatar({ user, className, ...props }) {
  const { user: currentUser } = useSelector(state => state.auth);
  const [hasError, setHasError] = React.useState(false);
  
  // Normalize IDs to handle both _id and id fields
  const getUserId = (u) => u?._id || u?.id;
  const getUrl = (u) => {
      const data = u?.avatar;
      return typeof data === 'object' ? data?.url : data;
  };
  
  const currentUserId = getUserId(currentUser);
  const targetUserId = getUserId(user);
  const isCurrentUser = currentUserId && targetUserId && currentUserId === targetUserId;
  
  // Pick the best available URL. If Redux URL is failing, try the one from the prop
  const reduxUrl = getUrl(currentUser);
  const propUrl = getUrl(user);
  
  // If we are looking at the current user, we have two possible sources for the URL
  // We prefer the prop if it's different (likely fresher from a fresh fetch)
  let avatarUrl = isCurrentUser ? (propUrl || reduxUrl) : propUrl;

  // Reset error state if the URL changes - this is key for when URLs are refreshed
  React.useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  // Calculate initials for fallback alt text
  const displayName = user?.firstName || user?.lastName || 'U';
  const initial = displayName.charAt(0).toUpperCase();

  const finalSrc = (!hasError && avatarUrl) ? avatarUrl : DEFAULT_AVATAR;

  return (
    <img
      key={avatarUrl || 'default'}
      src={finalSrc}
      alt={user?.firstName || initial}
      className={cn("rounded-full object-cover bg-muted ring-1 ring-border/10", className)}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
      {...props}
    />
  );
}
