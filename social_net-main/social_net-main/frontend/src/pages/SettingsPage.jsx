import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Bell, Shield, User, Trash2, Mail, AtSign, Moon, Lock, Settings, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toggleTheme } from '@/store/slices/uiSlice';
import { updateUser, logout } from '@/store/slices/authSlice';
import { userService } from '@/services/user.service';
import { DeleteAlertModal } from '@/components/modals/DeleteAlertModal';
import { toast } from 'react-hot-toast';

export function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handlePrivacyToggle = async (checked) => {
    setIsUpdatingPrivacy(true);
    try {
      const response = await userService.updatePrivacy(checked);
      if (response) {
        dispatch(updateUser({ isPrivate: checked }));
      }
    } catch (error) {
      console.error("Failed to update privacy", error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      dispatch(logout());
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error("Failed to delete account", error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error('All fields are required');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    setIsChangingPassword(true);
    try {
      await userService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("Failed to change password", error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
      <div className="w-full py-6 px-0 mb-20 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 px-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl flex-shrink-0 shadow-inner">
                      <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight">Settings</h1>
                      <p className="text-[13px] font-medium text-muted-foreground/70">
                          Manage your account and preferences
                      </p>
                  </div>
              </div>
          </div>

          <div className="px-6 space-y-8 max-w-4xl">
              {/* Account Section */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Account Information</h2>
                  </div>
                  <div className="p-6 rounded-[2rem] border border-border/40 bg-card/30 space-y-6 mx-2 md:mx-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between group">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Email address
                            </label>
                            <div className="text-base font-semibold text-foreground/90">{user?.email || 'user@example.com'}</div>
                          </div>
                      </div>
                      <div className="flex items-center justify-between group">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Full Name
                            </label>
                            <div className="text-base font-semibold text-foreground/90">{user?.firstName} {user?.lastName}</div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Preferences Section */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Preferences</h2>
                  </div>
                  <div className="rounded-[2rem] border border-border/40 bg-card/30 overflow-hidden divide-y divide-border/10 mx-2 md:mx-4 shadow-sm backdrop-blur-sm">
                      <div className="p-6 flex items-center justify-between hover:bg-primary/[0.04] active:bg-primary/[0.06] transition-all cursor-pointer group/item" onClick={handleThemeToggle}>
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                <Moon className="w-4 h-4 text-primary/70" /> Dark Mode
                              </div>
                              <div className="text-sm text-muted-foreground group-hover/item:text-muted-foreground/80 transition-colors">Swap between light and dark aesthetics</div>
                          </div>
                          <Switch 
                            checked={theme === 'dark'} 
                            onCheckedChange={handleThemeToggle}
                          />
                      </div>
                      <div className="p-6 flex items-center justify-between hover:bg-primary/[0.04] transition-all group/item cursor-pointer">
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                <Bell className="w-4 h-4 text-primary/70" /> Notifications
                              </div>
                              <div className="text-sm text-muted-foreground group-hover/item:text-muted-foreground/80 transition-colors">Manage your alert preferences</div>
                          </div>
                          <Switch defaultChecked />
                      </div>
                      <div className="p-6 flex items-center justify-between hover:bg-primary/[0.04] transition-all group/item cursor-pointer" onClick={() => handlePrivacyToggle(!user?.isPrivate)}>
                          <div className="space-y-1">
                              <div className="text-base font-bold flex items-center gap-2 group-hover/item:text-primary transition-colors">
                                <Lock className="w-4 h-4 text-primary/70" /> Private Account
                              </div>
                              <div className="text-sm text-muted-foreground font-medium text-muted-foreground/80 group-hover/item:text-muted-foreground/90 transition-colors">Only approved followers can see your content</div>
                          </div>
                          <Switch 
                            checked={user?.isPrivate || false} 
                            onCheckedChange={handlePrivacyToggle}
                            disabled={isUpdatingPrivacy}
                          />
                      </div>
                  </div>
              </section>

              {/* Security Section */}
              <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Security</h2>
                  </div>
                  <div className="p-8 rounded-[2.5rem] border border-border/40 bg-card/40 space-y-8 mx-2 md:mx-4 shadow-xl shadow-primary/[0.02] backdrop-blur-xl relative overflow-hidden group/security">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-[1.25rem] bg-primary/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-base font-black tracking-tight">Change Password</h3>
                            <p className="text-[12px] font-medium text-muted-foreground/60">Ensure your account is using a long, random password to stay secure.</p>
                          </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-1">Current Password</label>
                                <div className="relative group/input">
                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors duration-300" />
                                  <input 
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="w-full h-13 pl-12 pr-4 bg-muted/20 border border-border/40 rounded-2xl focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300 outline-none text-sm font-semibold"
                                    placeholder="Enter your current password"
                                  />
                                </div>
                            </div>
                            
                            <div className="hidden md:block" />

                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-1">New Password</label>
                                <div className="relative group/input">
                                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors duration-300" />
                                  <input 
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full h-13 pl-12 pr-4 bg-muted/20 border border-border/40 rounded-2xl focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300 outline-none text-sm font-semibold"
                                    placeholder="Enter new password"
                                  />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-1">Confirm New Password</label>
                                <div className="relative group/input">
                                  <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors duration-300" />
                                  <input 
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full h-13 pl-12 pr-4 bg-muted/20 border border-border/40 rounded-2xl focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300 outline-none text-sm font-semibold"
                                    placeholder="Repeat new password"
                                  />
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end pt-4">
                                <Button 
                                  type="submit"
                                  disabled={isChangingPassword}
                                  className="w-full sm:w-auto h-13 px-8 rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                >
                                  {isChangingPassword ? 'Saving Changes...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                      </div>
                  </div>
              </section>

              {/* Danger Zone */}
              <section className="pt-8 px-2">
                  <div className="p-6 rounded-[2rem] border border-red-500/20 bg-red-500/[0.02] flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                          <h3 className="text-lg font-bold text-red-500/90 mb-1">Delete Account</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">
                              Permanently remove your account and all associated data. This action is irreversible.
                          </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full sm:w-auto text-red-500 hover:text-white hover:bg-red-500 gap-2 rounded-2xl font-black h-12 px-6 transition-all shadow-sm hover:shadow-red-500/20 shadow-none border border-red-500/10 hover:border-red-500"
                      >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                      </Button>
                  </div>
              </section>
          </div>

          <DeleteAlertModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteAccount}
            loading={isDeleting}
            title="Delete Account Permanently"
            description="Are you absolutely sure? This will delete your profile, posts, following history, and settings. There is no coming back from this."
          />
      </div>
  );
}
