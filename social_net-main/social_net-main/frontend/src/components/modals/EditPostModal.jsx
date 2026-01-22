import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { postService } from '@/services/post.service';
import { Image, Video, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function EditPostModal({ isOpen, onClose, post, onSuccess }) {
  const { user } = useSelector(state => state.auth);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMedia, setCurrentMedia] = useState([]);
  const [newMedia, setNewMedia] = useState([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content || post.text || '');
      let existingMedia = [];
      if (post.media) existingMedia = Array.isArray(post.media) ? post.media : [post.media];
      setCurrentMedia(existingMedia.map(m => ({ ...m, preview: m.url, isExisting: true })));
      setNewMedia([]);
    }
  }, [post, isOpen]);

  const handleMediaUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newFile = { id: Math.random().toString(36).substr(2, 9), file: files[0], type, preview: URL.createObjectURL(files[0]), isExisting: false };
    setNewMedia([newFile]);
    setCurrentMedia([]);
  };

  const removeMedia = (item) => {
    if (item.isExisting) setCurrentMedia(prev => prev.filter(m => m !== item));
    else setNewMedia(prev => prev.filter(m => m.id !== item.id));
  };

  const handleSubmit = async () => {
    if (!content.trim() && currentMedia.length === 0 && newMedia.length === 0) return;
    try {
      setLoading(true);
      let response;
      if (newMedia.length > 0) {
         const formData = new FormData();
         formData.append('content', content);
         formData.append('media', newMedia[0].file);
         response = await postService.updatePost(post._id || post.id, formData);
      } else {
         const payload = { content };
         if (currentMedia.length === 0 && (post.media || (post.content && post.content.media))) payload.media = null;
         response = await postService.updatePost(post._id || post.id, payload);
      }
      if (onSuccess) onSuccess(response.data || response);
      onClose();
    } catch (error) {
      console.error("Failed to update post", error);
    } finally {
      setLoading(false);
    }
  };

  const displayMedia = [...currentMedia, ...newMedia];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>Make changes to your post content.</DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2">
          <div className="flex gap-4">
             <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                <UserAvatar user={user} className="w-full h-full object-cover"/>
             </div>
             <div className="flex-1">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What is happening?!" className="w-full bg-transparent border border-border rounded-xl p-3 text-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px] resize-none"/>
                {displayMedia.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
                    {displayMedia.map((item, idx) => (
                      <div key={item.id || idx} className="relative flex-shrink-0 w-full aspect-video rounded-xl overflow-hidden group border border-border">
                        {item.type === 'video' || (item.contentType && item.contentType.startsWith('video')) ? <video src={item.preview} className="w-full h-full object-cover" /> : <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />}
                        <button onClick={() => removeMedia(item)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
          <div className="flex justify-between items-center mt-6">
             <div className="flex gap-2">
                 {displayMedia.length === 0 && (
                     <>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-muted rounded-full text-primary transition-colors"><Image className="w-5 h-5" /></button>
                        <button onClick={() => videoInputRef.current?.click()} className="p-2 hover:bg-muted rounded-full text-primary transition-colors"><Video className="w-5 h-5" /></button>
                     </>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')}/>
                 <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')}/>
             </div>
             <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
                 <Button onClick={handleSubmit} disabled={loading || (!content.trim() && displayMedia.length === 0)} className="rounded-full font-bold">{loading ? 'Saving...' : 'Save'}</Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
