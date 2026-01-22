import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { fetchSuggestions, followUser, unfollowUser } from '@/store/slices/userSlice';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { performSearch, clearSearch } from '@/store/slices/searchSlice';
import { fetchTrending } from '@/store/slices/postSlice';
import { cn } from '@/lib/utils';

export function RightSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const requireAuth = useAuthGuard();
  const { suggestions, loading } = useSelector(state => state.user);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { results, loading: searchLoading } = useSelector(state => state.search);
  const { trends } = useSelector(state => state.posts);

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSuggestions());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    dispatch(fetchTrending());
  }, [dispatch]);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        dispatch(performSearch({ query: searchQuery, type: 'people' }));
      } else {
        dispatch(clearSearch());
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, dispatch, isAuthenticated]);

  const handleFollow = (userId) => {
    requireAuth(() => {
      dispatch(followUser(userId));
    }, 'login');
  };


  return (
    <div className="flex flex-col w-[290px] shrink-0 pt-0 pb-8 px-4 gap-8">
      
      {/* Enhanced Search */}
      <div className="relative group/search">
        {/* Search Input Container */}
        <div className="relative flex items-center">
          <div className="absolute left-4 text-muted-foreground group-focus-within/search:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search users, hashtags..." 
            className="w-full bg-muted/60 dark:bg-black/40 border border-border/50 rounded-2xl pl-12 pr-10 py-3 text-[15px] focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all outline-none placeholder:text-muted-foreground/60 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery.trim().length > 0 && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowResults(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {searchLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : (
                  <>
                    {/* People Section Only for now */}
                    {results?.users?.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">People</h4>
                        <div className="flex flex-col gap-1">
                          {results?.users?.map(user => (
                            <Link 
                              key={user._id} 
                              to={`/profile/${user._id}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-3 p-3 hover:bg-muted/80 rounded-xl transition-colors group/res"
                            >
                              <UserAvatar user={user} className="w-10 h-10 shadow-sm" />
                              <div className="flex flex-col flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-foreground truncate group-hover/res:text-primary transition-colors">
                                  {user.firstName} {user.lastName}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {results?.users?.length === 0 && (
                      <div className="p-10 text-center">
                        <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-3 bg-muted/30 border-t border-border text-center">
                <button className="text-xs font-bold text-primary hover:underline">
                  View all results
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Suggested Users - Real Data */}
      <div className="bg-card rounded-[2rem] p-6 border border-border/50 shadow-sm">
        <h3 className="font-bold text-lg mb-5 text-foreground leading-none">
          Who to follow
        </h3>
        <div className="flex flex-col gap-5">
          {loading ? (
             <p className="text-sm text-muted-foreground animate-pulse">Loading suggestions...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map(user => (
              <div key={user._id} className="flex items-center justify-between gap-3 group/item">
                <Link 
                  to={`/profile/${user._id || user.id}`} 
                  className="flex items-center gap-3 hover:opacity-80 transition-all flex-1 min-w-0"
                >
                  <UserAvatar 
                    user={user} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm" 
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] text-foreground truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-primary text-xs truncate font-semibold">{user.handle}</p>
                  </div>
                </Link>
                <Button 
                  size="sm" 
                  variant={user.followStatus === 'PENDING' ? "secondary" : "outline"}
                  className={cn(
                    "rounded-full h-8 px-4 font-bold text-xs transition-all shrink-0",
                    user.followStatus === 'PENDING' 
                      ? "bg-muted text-muted-foreground border-border" 
                      : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  )}
                  onClick={() => {
                    if (user.followStatus === 'PENDING') {
                      dispatch(unfollowUser(user._id || user.id));
                    } else {
                      handleFollow(user._id || user.id);
                    }
                  }}
                >
                  {user.followStatus === 'PENDING' ? 'Requested' : 
                   user.followsMe ? 'Follow back' : 'Follow'}
                </Button>
              </div>
            ))
          ) : (
             <p className="text-sm text-muted-foreground italic">No suggestions available.</p>
          )}
        </div>
      </div>

      {/* Trending (Static for now as no backend support) */}
      <div className="bg-card rounded-[2rem] p-6 border border-border/50 shadow-sm">
        <h3 className="font-bold text-lg mb-5 text-foreground">Trending</h3>
        <div className="flex flex-col gap-2">
          {trends.map(trend => (
            <div 
              key={trend.id} 
              onClick={() => {
                const normalizedTopic = trend.topic.replace('#', '').toLowerCase();
                navigate(`/recommended?topic=${normalizedTopic}`);
              }}
              className="cursor-pointer hover:bg-muted/50 p-3 -mx-2 rounded-2xl transition-all duration-200 group"
            >
              <p className="text-xs text-muted-foreground font-medium mb-1">Trending in {trend.topic}</p>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{trend.topic}</p>
              <p className="text-xs text-muted-foreground mt-1">{trend.posts}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground px-2">
        © 2025 Social App. All rights reserved.
      </div>
    </div>
  );
}

