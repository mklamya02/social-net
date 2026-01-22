import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search as SearchIcon, UserPlus, Users } from 'lucide-react';
import { performSearch, setSearchQuery as setGlobalQuery } from '@/store/slices/searchSlice';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { followUser } from '@/store/slices/userSlice';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const dispatch = useDispatch();
  const requireAuth = useAuthGuard();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { results, loading, query: globalQuery } = useSelector(state => state.search);
  const [localQuery, setLocalQuery] = useState(globalQuery || '');

  // Update local query when global query changes (e.g. from right sidebar) or auth status changes
  useEffect(() => {
    setLocalQuery(globalQuery);
    if (globalQuery) {
      dispatch(performSearch({ query: globalQuery, type: 'people' }));
    }
  }, [globalQuery, isAuthenticated, dispatch]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.trim()) {
        dispatch(setGlobalQuery(localQuery));
        dispatch(performSearch({ query: localQuery, type: 'people' }));
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [localQuery, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      dispatch(setGlobalQuery(localQuery));
      dispatch(performSearch({ query: localQuery, type: 'people' }));
    }
  };

  const onFollow = async (userId, isFollowing) => {
    requireAuth(async () => {
      const { followUser, unfollowUser } = await import('@/store/slices/userSlice');
      if (isFollowing) {
        dispatch(unfollowUser(userId));
      } else {
        dispatch(followUser(userId));
      }
    }, 'login');
  };

  return (
    <div className="w-full py-6 px-0">
      {/* Header - Matches NotificationsPage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-4 border-b border-border/40 px-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0">
            <SearchIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Search</h1>
            <p className="text-[13px] font-medium text-muted-foreground/70">
              Find and connect with people
            </p>
          </div>
        </div>
        
        {/* Search Input In Header/Top area */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-[300px] md:w-[400px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input 
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search names or emails..."
            className="w-full bg-muted/40 border border-border/40 rounded-2xl py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={loading || !localQuery.trim()}
          >
            <SearchIcon className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Main Content Area - Matches NotificationsPage card style */}
      <div className="bg-card/30 rounded-3xl border border-border/40 overflow-hidden shadow-sm mx-2 md:mx-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
             <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-sm font-medium animate-pulse">Searching for users...</p>
          </div>
        ) : results?.users?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <div className="p-4 bg-muted/30 rounded-full">
              {localQuery.trim() ? (
                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              ) : (
                <Users className="w-10 h-10 opacity-20" />
              )}
            </div>
            <p className="text-lg font-bold opacity-60">
              {localQuery.trim() ? `No results for "${localQuery}"` : "Discover people"}
            </p>
            <p className="text-[13px] opacity-40 max-w-[250px] text-center font-medium">
              {localQuery.trim() ? "Try searching for someone else or check your spelling." : "Start typing in the search bar to find members of the community."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {results?.users?.map((item) => (
              <div 
                key={item._id} 
                className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-all group"
              >
                <Link to={`/profile/${item._id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative">
                    <UserAvatar 
                      user={item} 
                      className="w-12 h-12 shadow-sm border border-border/50 group-hover:border-primary/30 transition-all rounded-2xl" 
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[15px] truncate group-hover:text-primary transition-colors">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-primary text-xs truncate font-semibold leading-none mt-1">
                      {item.handle}
                    </p>
                  </div>
                </Link>
                
                <Button 
                  onClick={() => onFollow(item._id, item.isFollowing || item.followStatus === 'PENDING')}
                  variant={(item.isFollowing || item.followStatus === 'PENDING') ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full px-5 font-bold text-xs h-9 transition-all shadow-sm",
                    (item.isFollowing || item.followStatus === 'PENDING')
                      ? "bg-muted text-muted-foreground border-transparent hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20" 
                      : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  )}
                >
                  {item.isFollowing ? (
                    <>Following</>
                  ) : item.followStatus === 'PENDING' ? (
                    <>Requested</>
                  ) : item.followsMe ? (
                    <>Follow back</>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Search Footer info */}
      {results.users.length > 0 && (
         <div className="mt-6 px-6 text-center">
            <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              Showing {results.users.length} member{results.users.length !== 1 ? 's' : ''}
            </p>
         </div>
      )}
    </div>
  );
}
