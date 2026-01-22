import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTEREST_OPTIONS } from '@/constants/interests';

export function TagsSelector({ selectedTags, onTagsChange }) {
  const selectedsContainerRef = useRef(null);

  const removeTag = (id) => {
    onTagsChange(selectedTags.filter((tagId) => tagId !== id));
  };

  const addTag = (id) => {
    if (!selectedTags.includes(id)) {
      onTagsChange([...selectedTags, id]);
    }
  };

  useEffect(() => {
    if (selectedsContainerRef.current) {
      selectedsContainerRef.current.scrollTo({
        left: selectedsContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [selectedTags]);

  const availableTags = INTEREST_OPTIONS.filter(
    (option) => !selectedTags.includes(option.id)
  );

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Selected Tags Display */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Selected Categories</span>
          <span className="text-xs font-medium text-primary/60">{selectedTags.length} selected</span>
        </div>
        <motion.div
          ref={selectedsContainerRef}
          layout
          className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar min-h-[48px]"
        >
          <AnimatePresence mode="popLayout">
            {selectedTags.map((tagId) => {
              const tag = INTEREST_OPTIONS.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <motion.div
                  key={tag.id}
                  layoutId={`tag-${tag.id}`}
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-2xl shrink-0 group hover:bg-primary/30 hover:border-primary/50 transition-all duration-300 shadow-sm shadow-primary/10"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{tag.icon}</span>
                  <motion.span
                    layoutId={`tag-${tag.id}-label`}
                    className="text-sm font-black text-primary tracking-tight"
                  >
                    {tag.label}
                  </motion.span>
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="ml-1 p-1 bg-primary/10 hover:bg-primary/30 rounded-lg text-primary transition-all active:scale-90"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {selectedTags.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground/40 italic text-sm px-1">
              <Hash className="w-4 h-4" />
              No categories selected yet...
            </div>
          )}
        </motion.div>
      </div>

      {/* Available Tags Picker */}
      <div className="space-y-3">
        <div className="px-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Suggestions</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {availableTags.map((tag) => (
              <motion.button
                key={tag.id}
                layoutId={`tag-${tag.id}`}
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => addTag(tag.id)}
                className="flex items-center gap-3 px-5 py-3 bg-muted/20 hover:bg-card border border-border/50 hover:border-primary/30 rounded-2xl shrink-0 transition-all group shadow-sm hover:shadow-md hover:shadow-primary/5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xl group-hover:scale-110 transition-transform relative z-10">{tag.icon}</span>
                <motion.span
                  layoutId={`tag-${tag.id}-label`}
                  className="text-sm font-bold text-foreground/70 group-hover:text-primary transition-colors relative z-10"
                >
                  {tag.label}
                </motion.span>
                <div className="ml-2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 relative z-10">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
