import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import EmojiPicker from 'emoji-picker-react';
import { Loader2, Smile } from 'lucide-react';
import { useSelector } from 'react-redux';

export function CommentDialog({ open, onOpenChange, onSubmit, loading, title = "Reply to post", initialContent = "" }) {
  const [content, setContent] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const { theme } = useSelector(state => state.ui);

  // Set initial content when dialog opens
  useEffect(() => {
    if (open && initialContent) {
      setContent(initialContent);
    } else if (!open) {
      setContent('');
    }
  }, [open, initialContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
    setShowPicker(false);
  };
  const onEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Write your reply below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="relative">
             <Textarea
                className="min-h-[100px] pr-10 resize-none"
                placeholder="Post your reply"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                spellCheck="false"
                data-gramm="false"
             />
             <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute bottom-2 right-2 hover:bg-transparent"
                onClick={() => setShowPicker(!showPicker)}
             >
                <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
             </Button>
             
             {showPicker && (
               <div className="absolute z-50 right-0 top-full mt-2" ref={pickerRef}>
                 <EmojiPicker 
                    onEmojiClick={onEmojiClick} 
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    width={300}
                    height={350}
                    lazyLoadEmojis={true}
                 />
               </div>
             )}
          </div>
          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim() || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
