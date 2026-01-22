import React from 'react';
import { Home, User, Bell, Bookmark, Settings, Hash, LogOut, Search, Sparkles } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover'; // We might re-use popover here or just link

export function LeftSidebar() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);
  const dispatch = useDispatch();

  const handleAuthAction = (action) => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
    } else {
      action();
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { icon: <Home className="w-6 h-6" />, label: "Home", href: "/" },
    { icon: <Search className="w-6 h-6" />, label: "Search", href: "/search" },
    { icon: <Bell className="w-6 h-6" />, label: "Notifications", href: "/notifications", auth: true },
    { icon: <User className="w-6 h-6" />, label: "Profile", href: "/profile/me", auth: true },
    { icon: <Bookmark className="w-6 h-6" />, label: "Bookmarks", href: "/bookmarks", auth: true },
    { icon: <Settings className="w-6 h-6" />, label: "Settings", href: "/settings", auth: true },
  ];

  return (
    <div className="flex flex-col h-full w-[80px] lg:w-[275px] shrink-0 pt-0 pb-2">
      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item, index) => {
          if (item.auth && !isAuthenticated) return null;

          return (
            <NavLink 
              key={index} 
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-200 w-full group relative",
                isActive 
                  ? "bg-primary/10 text-primary font-bold shadow-sm" 
                  : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full transition-all duration-300 transform scale-y-0 opacity-0",
                "group-[.active]:scale-y-100 group-[.active]:opacity-100"
              )} />
              
              <div className="p-1 rounded-lg transition-colors relative">
                {item.icon}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] font-bold border-2 border-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-lg hidden lg:block font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {!isAuthenticated && (
        <div className="mt-8 mx-2 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 shadow-sm">
          <h3 className="font-bold text-lg mb-2 text-foreground">New here?</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Sign up now to join the community and share your thoughts.</p>
          <Button className="w-full rounded-full py-6 font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-95" onClick={() => dispatch(openAuthModal('signup'))}>
            Join Now
          </Button>
        </div>
      )}

      {isAuthenticated && (
        <div className="mt-auto px-2 pt-4 border-t border-border/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-2xl hover:bg-red-500/10 dark:hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 group relative overflow-hidden"
          >
             <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                <LogOut className="w-5 h-5" />
             </div>
             <span className="text-base font-bold text-red-500 transition-colors hidden lg:block">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

