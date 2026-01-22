import React from 'react';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { AuthModal } from '@/components/modals/AuthModal';

import { AnimatedBackground } from './AnimatedBackground';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/20 relative">
      <AnimatedBackground />

      <Navbar />
      
      <div className="w-full md:w-[95%] lg:w-[85%] xl:w-[70%] mx-auto flex justify-between items-start pt-24 relative z-10 px-0 min-h-screen bg-background/40 backdrop-blur-3xl border-x border-border/10">
        <aside className="shrink-0 hidden md:block sticky top-24 self-start h-[calc(100vh-96px)] overflow-y-auto scrollbar-hide border-r border-border/50">
          <LeftSidebar />
        </aside>
        
        <main className="flex-1 min-w-0 pb-10">
          {children}
        </main>
        
        <aside className="shrink-0 hidden xl:block sticky top-24 self-start h-[calc(100vh-96px)] overflow-y-auto scrollbar-hide border-l border-border/50">
          <RightSidebar />
        </aside>
      </div>

      {/* Global Modals */}
      <AuthModal />
    </div>
  );
}
