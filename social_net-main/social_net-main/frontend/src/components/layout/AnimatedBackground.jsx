import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Curated list of high-quality emojis
const EMOJIS = [
  // Faces
  '😊', '😎', '🤩', '🥳', '🤯', '🥰', '🤪', '😇',
  // Hearts & Reactions
  '❤️', '💙', '💜', '🔥', '✨', '💯', '🌈', '🌟',
  // Tech & Social
  '💬', '🔔', '📢', '📱', '💻', '📸', '🎧', '🚀',
  // Objects
  '🎨', '💡', '🎁', '💎', '🔑', '🎵', '🎈', '⚡',
  //emojis
  '👍', '👎', '👌', '👊', '👏', '👋', "👋", "👋",
];

/**
 * AnimatedBackground Component
 * 
 * Renders a fixed background with floating emojis.
 * Designed to sit behind the main content with a glassmorphism effect.
 */
export function AnimatedBackground() {
  // Generate random positions and animation properties once
  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 1.0, // 1.0rem to 3.5rem
      duration: Math.random() * 15 + 15, // 15s to 30s
      delay: Math.random() * 10,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Optional: Add a subtle mesh gradient or noise texture here if needed */}
      
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute select-none opacity-60 dark:opacity-30 blur-[1px]"
          style={{
            top: p.top,
            left: p.left,
            fontSize: `${p.size}rem`,
          }}
          initial={{ y: 0, rotate: p.rotate }}
          animate={{
            y: [0, -40, 0], // Float up and down
            rotate: [p.rotate, p.rotate + 20, p.rotate], // Slight rotation
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}
