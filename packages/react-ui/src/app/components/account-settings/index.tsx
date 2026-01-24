import { DialogTitle } from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Camera, Mail } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { UserBadges } from '@/components/custom/user-badges';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';
import { userApi } from '@/lib/user-api';
import {
  AP_MAXIMUM_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_ALLOWED_TYPES,
  UserWithBadges,
} from '@activepieces/shared';

import { DeleteAccount } from './delete-account';
import LanguageToggle from './language-toggle';
import ThemeToggle from './theme-toggle';

export interface AccountSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSettingsDialog({
  open,
  onClose,
}: AccountSettingsDialogProps) {
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => userApi.updateMe(file),
    onSuccess: () => {
      userHooks.invalidateCurrentUser(queryClient);
      toast.success(t('Profile picture updated successfully'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('Failed to upload profile picture'));
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > AP_MAXIMUM_PROFILE_PICTURE_SIZE) {
        toast.error(t('File size exceeds 5MB limit'));
        return;
      }
      if (!PROFILE_PICTURE_ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          t('Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP'),
        );
        return;
      }
      uploadMutation.mutate(file);
    }
    event.target.value = '';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] pb-4 flex flex-col px-5">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {t('Account Settings')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1" viewPortClassName="px-1">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="relative group cursor-pointer"
                onClick={handleAvatarClick}
              >
                <UserAvatar
                  name={(user?.firstName ?? '') + ' ' + (user?.lastName ?? '')}
                  email={user?.email ?? ''}
                  size={64}
                  disableTooltip
                  imageUrl={user?.imageUrl}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadMutation.isPending}
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </div>
              </div>
            </div>

            <UserBadges user={user as UserWithBadges | null} />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <DeleteAccount />
          </div>
        </ScrollArea>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

export default AccountSettingsDialog;
