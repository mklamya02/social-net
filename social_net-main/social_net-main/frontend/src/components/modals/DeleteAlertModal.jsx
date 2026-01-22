import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function DeleteAlertModal({ isOpen, onClose, onConfirm, loading, title = "Delete Post", description = "Are you sure you want to delete this post? This action cannot be undone." }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-background rounded-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            
            <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl">{title}</DialogTitle>
                <DialogDescription>
                    {description}
                </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex gap-2 w-full mt-4 sm:justify-center">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">
                    Cancel
                </Button>
                <Button variant="destructive" onClick={onConfirm} disabled={loading} className="flex-1 rounded-full bg-red-600 hover:bg-red-700">
                    {loading ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
