import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Image, Video, X, Smile, Hash, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTheme } from '@/hooks/useTheme';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { INTEREST_OPTIONS } from '@/constants/interests';
import { TagsSelector } from './TagsSelector';
import { AnimatePresence, motion } from 'framer-motion';

export function CreatePost({ onPost }) {
  const { user } = useSelector(state => state.auth);
  const { theme } = useTheme();
  const requireAuth = useAuthGuard();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiData) => {
    setContent(prev => prev + emojiData.emoji);
  };

  const handleInterestSelect = (tags) => {
    setSelectedInterests(tags);
  };

  const handleMediaUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newMedia = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type,
      preview: URL.createObjectURL(file)
    }));

    setMedia(prev => [...prev, ...newMedia]);
    e.target.value = ''; // Reset input
  };

  const removeMedia = (id) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && media.length === 0) || loading || selectedInterests.length === 0) return;

    try {
      setLoading(true);
      // Create FormData to send file properly
      const formData = new FormData();
      
      // Append interest hashtags to content if they exist
      let finalContent = content;
      if (selectedInterests.length > 0) {
        const hashtags = selectedInterests.map(id => `#${id}`).join(' ');
        if (!finalContent.includes(hashtags)) { // Basic check, though usually we want to append anyway
          finalContent = finalContent ? `${finalContent}\n\n${hashtags}` : hashtags;
        }
      }
      
      formData.append('content', finalContent);
      
      // Add the actual file (only first media item for now, backend expects single file)
      if (media.length > 0) {
        formData.append('media', media[0].file);
      }

      await onPost(formData);

      setContent('');
      setMedia([]);
      setSelectedInterests([]);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !content.trim() && media.length === 0 || selectedInterests.length === 0;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm transition-all hover:border-primary/20 group mx-2 md:mx-4">
      {/* Post Input Area */}
      <div className="flex gap-5">
         {/* User Avatar */}
         <div className="w-12 h-12 rounded-full ring-2 ring-primary/10 overflow-hidden flex-shrink-0 transition-all group-hover:ring-primary/30">
            <UserAvatar 
              user={user} 
              className="w-full h-full object-cover"
            />
         </div>
        <div className="flex-1 space-y-4">

          
          <div className="relative group/textarea">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={(e) => {
                requireAuth(() => {}, 'login');
              }}
              placeholder="What is happening?!" 
              className="w-full bg-transparent border-none text-[19px] text-foreground font-medium focus:ring-0 focus:outline-none outline-none placeholder:text-muted-foreground/50 resize-none min-h-[100px] p-0 transition-all duration-300"
              rows={Math.max(2, content.split('\n').length)}
              spellCheck="false"
              data-gramm="false"
            />
            {content.length === 0 && (
              <div className="absolute left-0 bottom-1 w-full h-[1px] bg-gradient-to-r from-primary/20 via-primary/5 to-transparent scale-x-0 group-focus-within/textarea:scale-x-100 transition-transform duration-700" />
            )}
          </div>

          {/* Selected Tags Preview (Inline) */}
          {selectedInterests.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <AnimatePresence mode="popLayout">
                {selectedInterests.map((id) => {
                  const tag = INTEREST_OPTIONS.find(t => t.id === id);
                  if (!tag) return null;
                  return (
                    <motion.div
                      key={tag.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: -10 }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl group hover:bg-primary/20 hover:border-primary/40 transition-all cursor-default shadow-sm shadow-primary/5 active:scale-95"
                    >
                      <span className="text-sm group-hover:scale-110 transition-transform">{tag.icon}</span>
                      <span className="text-xs font-black text-primary tracking-tight">#{tag.id}</span>
                      <button 
                        onClick={() => setSelectedInterests(prev => prev.filter(t => t !== id))}
                        className="ml-1 p-1 bg-primary/10 hover:bg-primary/30 rounded-lg text-primary transition-all active:scale-90"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
          
          {/* Media Previews */}
          {media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
              {media.map(item => (
                <div key={item.id} className="relative flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden group border border-border">
                  {item.type === 'image' ? (
                    <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.preview} className="w-full h-full object-cover" />
                  )}
                  <button 
                    onClick={() => removeMedia(item.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Actions & Footer */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/10">
        {/* Media & Emoji Icons */}
        <div className="flex gap-1 text-primary">
          <button 
            onClick={() => requireAuth(() => fileInputRef.current?.click())}
            className="p-2.5 hover:bg-primary/10 rounded-full text-primary transition-all duration-200 active:scale-90"
            title="Add Photo"
          >
            <Image className="w-5 h-5" />
          </button>
          <button 
            onClick={() => requireAuth(() => videoInputRef.current?.click())}
            className="p-2.5 hover:bg-primary/10 rounded-full text-primary transition-all duration-200 active:scale-90"
            title="Add Video"
          >
            <Video className="w-5 h-5" />
          </button>
          
          <Popover>
            <PopoverTrigger asChild>
               <button 
                 className={cn(
                   "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ml-1",
                   selectedInterests.length > 0 
                     ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                     : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                 )}
               >
                 <Hash className="w-3.5 h-3.5" />
                 <span>{selectedInterests.length > 0 ? `${selectedInterests.length} Topics` : "Topics"}</span>
                 <ChevronDown className="w-3 h-3 opacity-50" />
               </button>
            </PopoverTrigger>
            <PopoverContent 
               className="p-4 w-[380px] bg-card/95 backdrop-blur-3xl border-border/50 shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-[2rem] animate-in fade-in-0 zoom-in-95 duration-300 z-50 overflow-hidden" 
               align="start" 
               side="bottom"
               sideOffset={12}
            >
               <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
               <div className="relative z-10">
                 <TagsSelector 
                   selectedTags={selectedInterests} 
                   onTagsChange={handleInterestSelect} 
                 />
               </div>
            </PopoverContent>
          </Popover>
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <button 
                className="p-2.5 hover:bg-primary/10 rounded-full text-primary transition-all duration-200 active:scale-90 outline-none"
                title="Add Emoji"
                onClick={(e) => {
                  e.preventDefault();
                  requireAuth(() => setShowEmojiPicker(!showEmojiPicker));
                }}
              >
                <Smile className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none bg-transparent shadow-none w-auto" side="top" align="start" sideOffset={10}>
              <div className="rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl animate-in zoom-in-95 duration-200">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  theme={theme}
                  width={320}
                  height={420}
                  searchDisabled={false}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  lazyLoadEmojis={true}
                  searchPlaceHolder="Search emojis..."
                />
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Hidden Inputs */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={(e) => handleMediaUpload(e, 'image')}
          />
          <input 
            type="file" 
            ref={videoInputRef} 
            className="hidden" 
            accept="video/*"
            onChange={(e) => handleMediaUpload(e, 'video')}
          />
        </div>
        <div className="flex items-center gap-6">
           {content.length > 0 && (
             <span className={cn(
               "text-xs font-bold",
               content.length > 280 ? "text-destructive" : "text-muted-foreground/60"
             )}>
               {content.length} / 280
             </span>
           )}
           <Button 
             onClick={handleSubmit} 
             disabled={isDisabled || loading}
             className="rounded-2xl font-black px-10 py-7 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
           >
             {loading ? 'Posting...' : 'Post'}
           </Button>
        </div>
      </div>
    </div>
  );
}
