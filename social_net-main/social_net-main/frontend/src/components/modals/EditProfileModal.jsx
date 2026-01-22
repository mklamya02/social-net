import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppInput } from '@/components/ui/app-input';
import { updateUser } from '@/store/slices/authSlice';
import { Camera, Eye, Trash2, Upload, Calendar as CalendarIcon, Lock, Globe, EyeOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { DEFAULT_AVATAR, DEFAULT_BANNER } from '@/lib/constants';

export function EditProfileModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
    birthday: '',
    avatar: '',
    banner: '',
    isPrivate: false,
    showBirthday: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday || '',
        avatar: user.avatar || '',
        banner: user.banner || DEFAULT_BANNER,
        isPrivate: user.isPrivate || false,
        showBirthday: user.showBirthday !== false // Default to true if not specified
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Birthday Parts Logic
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const years = Array.from({ length: 121 }, (_, i) => new Date().getFullYear() - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getBirthdayPart = (part) => {
    if (!formData.birthday) return "";
    const date = new Date(formData.birthday);
    if (isNaN(date.getTime())) return "";
    
    if (part === 'year') return date.getFullYear().toString();
    if (part === 'month') return date.getMonth().toString();
    if (part === 'day') return date.getDate().toString();
    return "";
  };

  const handleBirthdayPartChange = (part, value) => {
    let current = formData.birthday ? new Date(formData.birthday) : new Date();
    if (isNaN(current.getTime())) current = new Date();

    let y = current.getFullYear();
    let m = current.getMonth();
    let d = current.getDate();

    if (part === 'year') y = parseInt(value);
    if (part === 'month') m = parseInt(value);
    if (part === 'day') d = parseInt(value);

    const newDate = new Date(y, m, d);
    setFormData(prev => ({
      ...prev,
      birthday: newDate.toISOString()
    }));
  };

  // Photo Action Logic
  const fileInputRef = useRef(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  // Banner Action Logic
  const bannerInputRef = useRef(null);
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  // Profile Photo Handlers
  // Check if we have new files
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newBannerFile, setNewBannerFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setNewAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, avatar: reader.result }));
            setShowPhotoMenu(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setNewBannerFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, banner: reader.result }));
            setShowBannerMenu(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setNewAvatarFile(null); // Assuming delete means revert or empty? currently implementation sets string url. 
    // Backend doesn't support deleting yet, just replacing. 
    // But setting avatar to default string won't persist if backend expects file or string url in body.
    setFormData(prev => ({ ...prev, avatar: DEFAULT_AVATAR }));
    setShowPhotoMenu(false);
  };

  const handleDeleteBanner = () => {
    setNewBannerFile(null);
    setFormData(prev => ({ ...prev, banner: DEFAULT_BANNER }));
    setShowBannerMenu(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // Determine if we need FormData (files present)
        const isFormData = !!newAvatarFile || !!newBannerFile;
        let dataToSubmit;

        if (isFormData) {
            dataToSubmit = new FormData();
            // Append all fields
            Object.keys(formData).forEach(key => {
                if (key === 'avatar') {
                    if (newAvatarFile) {
                        dataToSubmit.append('avatar', newAvatarFile);
                    } else if (formData.avatar === DEFAULT_AVATAR && user.avatar) {
                        // User explicitly deleted avatar
                        dataToSubmit.append('avatar', DEFAULT_AVATAR);
                    }
                } else if (key === 'banner') {
                    if (newBannerFile) {
                        dataToSubmit.append('banner', newBannerFile);
                    } else if (formData.banner === DEFAULT_BANNER && user.banner) {
                        // User explicitly deleted banner
                        dataToSubmit.append('banner', DEFAULT_BANNER);
                    }
                } else {
                    dataToSubmit.append(key, formData[key]);
                }
            });
        } else {
            dataToSubmit = { ...formData };
        }

        const { updateUserProfile } = await import('@/store/slices/authSlice');
        await dispatch(updateUserProfile(user.id, dataToSubmit, isFormData));
        if (onSuccess) onSuccess();
        onClose();
    } catch (error) {
        console.error("Save failed", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information, including name, bio, and privacy settings.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-[200px] w-full bg-muted group/banner">
           <img 
              src={formData.banner} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                e.target.src = DEFAULT_BANNER;
              }}
           />
           <div 
              onClick={() => setShowBannerMenu(!showBannerMenu)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/banner:opacity-100 transition-opacity cursor-pointer z-10"
           >
              <Camera className="w-8 h-8 text-white/80" />
           </div>

           {/* Hidden Banner Input */}
           <input 
              type="file" 
              ref={bannerInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleBannerChange}
           />

           {/* Banner Action Menu */}
           {showBannerMenu && (
             <>
               <div 
                 className="fixed inset-0 z-40" 
                 onClick={() => setShowBannerMenu(false)}
               />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 w-48 bg-popover text-popover-foreground border border-border shadow-md rounded-xl overflow-hidden z-50 flex flex-col py-1">
                 <button 
                    onClick={() => window.open(formData.banner, '_blank')}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                 >
                    <Eye className="w-4 h-4" /> See it
                 </button>
                 <button 
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                 >
                    <Upload className="w-4 h-4" /> Upload new one
                 </button>
                 <button 
                    onClick={handleDeleteBanner}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium text-left transition-colors"
                 >
                    <Trash2 className="w-4 h-4" /> Delete it
                 </button>
               </div>
             </>
           )}
        </div>

        <div className="px-6 relative">
           <div className="absolute -top-[50px] left-6">
              <div className="relative group">
                <img 
                  src={formData.avatar || DEFAULT_AVATAR} 
                  alt="Profile" 
                  className="w-[100px] h-[100px] rounded-full object-cover border-4 border-background"
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
                <div 
                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent z-20"
                >
                   <Camera className="w-6 h-6 text-white/80" />
                </div>

                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {/* Action Menu */}
                {showPhotoMenu && (
                    <>
                    <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setShowPhotoMenu(false)}
                    />
                    <div className="absolute top-[110%] left-0 w-48 bg-popover text-popover-foreground border border-border shadow-md rounded-xl overflow-hidden z-40 flex flex-col py-1">
                        <button 
                            onClick={() => window.open(formData.avatar, '_blank')}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                        >
                            <Eye className="w-4 h-4" /> See it
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-sm font-medium text-left transition-colors"
                        >
                            <Upload className="w-4 h-4" /> Upload new one
                        </button>
                        <button 
                            onClick={handleDeletePhoto}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium text-left transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete it
                        </button>
                    </div>
                    </>
                )}
              </div>
            </div>
            
            <div className="mt-[70px] px-1">
                <h2 className="text-2xl font-black text-foreground leading-none">{user?.firstName} {user?.lastName}</h2>
                <p className="text-primary font-bold text-sm mt-1">{user?.handle}</p>
            </div>
            
            <div className="pt-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <AppInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                />
                <AppInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
                 <textarea 
                   className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                   name="bio"
                   value={formData.bio}
                   onChange={handleChange}
                   placeholder="Bio"
                 />
              </div>

               <AppInput
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
              />

              <AppInput
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Website"
              />

              <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                      <label className="text-sm font-bold">Birth date</label>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, showBirthday: !prev.showBirthday }))}
                        className={cn(
                            "flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-300",
                            formData.showBirthday 
                                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                                : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                        )}
                      >
                          {formData.showBirthday ? (
                              <><Eye className="w-3.5 h-3.5" /> Shown on profile</>
                          ) : (
                              <><EyeOff className="w-3.5 h-3.5" /> Hidden from profile</>
                          )}
                      </button>
                  </div>
                  
                  <div className={cn(
                      "grid grid-cols-3 gap-3 transition-opacity duration-300",
                      !formData.showBirthday && "opacity-40 grayscale-[0.5] pointer-events-none"
                  )}>
                      {/* Month Select */}
                      <div className="relative group">
                          <select
                              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background/50 text-foreground font-medium text-sm appearance-none outline-none transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer"
                              value={getBirthdayPart('month')}
                              onChange={(e) => handleBirthdayPartChange('month', e.target.value)}
                          >
                              <option value="" disabled>Month</option>
                              {months.map((m, i) => (
                                  <option key={m} value={i}>{m}</option>
                              ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>

                      {/* Day Select */}
                      <div className="relative group">
                          <select
                              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background/50 text-foreground font-medium text-sm appearance-none outline-none transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer"
                              value={getBirthdayPart('day')}
                              onChange={(e) => handleBirthdayPartChange('day', e.target.value)}
                          >
                              <option value="" disabled>Day</option>
                              {days.map(d => (
                                  <option key={d} value={d}>{d}</option>
                              ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>

                      {/* Year Select */}
                      <div className="relative group">
                          <select
                              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background/50 text-foreground font-medium text-sm appearance-none outline-none transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer text-center"
                              value={getBirthdayPart('year')}
                              onChange={(e) => handleBirthdayPartChange('year', e.target.value)}
                          >
                              <option value="" disabled>Year</option>
                              {years.map(y => (
                                  <option key={y} value={y}>{y}</option>
                              ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                      </div>
                  </div>
              </div>

              <div className={cn(
                  "flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300",
                  formData.isPrivate 
                    ? "bg-primary/5 border-primary/20 shadow-sm shadow-primary/5" 
                    : "bg-muted/20 border-border/50"
              )}>
                  <div className="flex gap-4">
                      <div className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300",
                          formData.isPrivate ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                          {formData.isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                      </div>
                      <div className="space-y-0.5">
                          <label className="text-sm font-bold block">Private Profile</label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                              {formData.isPrivate 
                                ? "Only approved followers can see your posts." 
                                : "Anyone can see your posts and profile."}
                          </p>
                      </div>
                  </div>
                  <Switch 
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                  />
              </div>
           </div>
        </div>

        <div className="p-6 pt-0 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full" disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} className="rounded-full px-8" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
