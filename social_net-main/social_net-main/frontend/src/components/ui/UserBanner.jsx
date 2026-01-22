import React from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { DEFAULT_BANNER } from "@/lib/constants";

/**
 * UserBanner component that automatically manages banner display and fallbacks.
 * Syncs with Redux for the current user to ensure instant updates.
 */
export function UserBanner({ user, className, ...props }) {
  const { user: currentUser } = useSelector(state => state.auth);
  const [hasError, setHasError] = React.useState(false);
  
  const getUserId = (u) => u?._id || u?.id;
  const getUrl = (u) => {
      const data = u?.banner;
      return typeof data === 'object' ? data?.url : data;
  };
  
  const currentUserId = getUserId(currentUser);
  const targetUserId = getUserId(user);
  const isCurrentUser = currentUserId && targetUserId && currentUserId === targetUserId;
  
  const reduxUrl = getUrl(currentUser);
  const propUrl = getUrl(user);
  
  // Preferprop for fresh data, fallback to redux for current user
  let bannerUrl = (isCurrentUser && !propUrl) ? reduxUrl : propUrl;

  React.useEffect(() => {
    setHasError(false);
  }, [bannerUrl]);

  const finalSrc = (!hasError && bannerUrl) ? bannerUrl : DEFAULT_BANNER;
  const isPlaceholder = !bannerUrl || hasError;

  return (
    <div className={cn("w-full h-full relative overflow-hidden group", className)} {...props}>
      <img
        key={bannerUrl || 'default-banner'}
        src={finalSrc}
        alt={user?.firstName ? `${user.firstName}'s banner` : "User banner"}
        className={cn(
           "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
           isPlaceholder ? "opacity-40 grayscale" : "opacity-100"
        )}
        onError={() => {
          if (!hasError) setHasError(true);
        }}
      />
      
      {/* Fallback gradient if we have no banner at all */}
      {isPlaceholder && (
         <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background -z-10" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
    </div>
  );
}
