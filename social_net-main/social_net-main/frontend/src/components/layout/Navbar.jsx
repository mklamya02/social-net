import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, User, Bell, Bookmark, Settings, LogIn, Menu, Sun, Moon, LayoutGrid, Users, Search, LogOut, Sparkles } from 'lucide-react';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { openAuthModal, setFeedMode } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const { feedMode } = useSelector(state => state.ui);
  const requireAuth = useAuthGuard();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // New controlled state for User Menu

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false); // Close menu on logout
  };

  const logoElement = (
    <div className="relative w-8 h-8 flex items-center justify-center cursor-pointer">
       <img 
         src={theme === 'dark' ? "/white_logo.png" : "/black_logo.png"} 
         alt="Social" 
         className="w-full h-full object-contain"
       />
    </div>
  );

  return (
    <>
    <header className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      <div className="w-full md:w-[95%] lg:w-[85%] xl:w-[70%] pointer-events-auto bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg rounded-full px-6 py-2 h-16 flex items-center justify-between mx-auto transition-all duration-300">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            {logoElement}
            <span className="ml-2 font-bold hidden sm:block text-xl">Social</span>
          </Link>
        </div>

        {/* Center: Feed Filter (Home and Recommended Pages) */}
        {(location.pathname === '/' || location.pathname === '/recommended') && (
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/10 backdrop-blur-md absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <Link to="/recommended">
              <button 
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300",
                  location.pathname === '/recommended'
                    ? "bg-card text-primary shadow-sm ring-1 ring-border/50 translate-z-0 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Recommended</span>
              </button>
            </Link>
            <button 
              onClick={() => {
                if (location.pathname === '/recommended') {
                  navigate('/');
                }
                dispatch(setFeedMode('public'));
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300",
                location.pathname === '/' && feedMode === 'public' 
                  ? "bg-card text-primary shadow-sm ring-1 ring-border/50 translate-z-0 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Public</span>
            </button>
            <button 
              onClick={() => requireAuth(() => {
                if (location.pathname === '/recommended') {
                  navigate('/');
                }
                dispatch(setFeedMode('following'));
              })}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300",
                location.pathname === '/' && feedMode === 'following' 
                  ? "bg-card text-primary shadow-sm ring-1 ring-border/50 translate-z-0 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Following</span>
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {isAuthenticated ? (
            <>
              <NotificationsPopover />
              
              <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <PopoverTrigger asChild>
                  <button className="outline-none rounded-full transition-all hover:ring-2 hover:ring-primary/50 active:scale-95">
                    <UserAvatar 
                      user={user} 
                      className="w-9 h-9 rounded-full border border-border cursor-pointer"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-56 p-1.5 data-[state=closed]:!animate-none data-[state=closed]:!fade-out-0 data-[state=closed]:!zoom-out-100" 
                  align="end"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="px-3 py-2">
                       <p className="text-sm font-bold truncate">{user?.firstName} {user?.lastName}</p>
                       <p className="text-xs text-muted-foreground truncate">{user?.handle || user?.email}</p>
                    </div>
                    
                    <div className="h-px bg-border my-1" />

                    <Link 
                      to="/profile/me" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Profile</span>
                    </Link>
                    
                    <Link 
                      to="/settings" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>

                    <div className="h-px bg-border my-1" />
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => dispatch(openAuthModal('login'))}
                className="rounded-full hidden sm:flex font-semibold"
              >
                Log In
              </Button>
              <Button 
                size="sm" 
                onClick={() => dispatch(openAuthModal('signup'))}
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 font-semibold shadow-md"
              >
                Sign Up
              </Button>
            </>
          )}

          <button className="md:hidden p-2 text-foreground/80 hover:text-foreground" onClick={toggleMenu} aria-label="Toggle Menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Content - Positioned absolutely below the floating navbar */}
      <div className={`absolute top-20 w-[90%] md:w-[400px] border border-white/10 rounded-2xl shadow-xl transition-all ease-in-out duration-300 overflow-hidden bg-background/80 backdrop-blur-xl
                       ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="p-4 space-y-4">
          

          <nav className="flex flex-col space-y-1">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium">
              <Home className="w-5 h-5" /> Home
            </Link>
            {isAuthenticated && (
              <Link to="/recommended" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium" onClick={toggleMenu}>
                <Sparkles className="w-5 h-5" /> Recommended
              </Link>
            )}
            <Link to="/search" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium" onClick={toggleMenu}>
              <Search className="w-5 h-5" /> Search
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/notifications" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-sm font-medium" onClick={toggleMenu}>
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" /> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile/me" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium" onClick={toggleMenu}>
                  <User className="w-5 h-5" /> Profile
                </Link>
                <Link to="/bookmarks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium">
                  <Bookmark className="w-5 h-5" /> Bookmarks
                </Link>
                <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium">
                  <Settings className="w-5 h-5" /> Settings
                </Link>
              </>
            )}
             {!isAuthenticated && (
               <button 
                 onClick={() => { dispatch(openAuthModal('login')); toggleMenu(); }}
                 className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-sm font-medium w-full text-left"
               >
                 <LogIn className="w-5 h-5" /> Log In
               </button>
             )}
          </nav>
        </div>
      </div>
    </header>
    </>
  );
}
