import {
  AP_MAXIMUM_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_ALLOWED_TYPES,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Camera, Mail } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { userHooks, userMutations } from '@/hooks/user-hooks';

import { LanguageToggle } from './language-toggle';
import { ThemeToggle } from './theme-toggle';

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

  const uploadMutation = userMutations.useUploadProfilePicture({
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
      <DialogContent size="lg" className="flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('Account Settings')}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1" viewPortClassName="px-1">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div
                className="group relative cursor-pointer"
                onClick={handleAvatarClick}
              >
                <UserAvatar
                  name={(user?.firstName ?? '') + ' ' + (user?.lastName ?? '')}
                  email={user?.email ?? ''}
                  size={64}
                  disableTooltip
                  imageUrl={user?.imageUrl}
                />
                <div
                  data-theme="dark"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-scrim opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera className="size-5 text-gray-12" />
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
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-11">
                  <Mail className="size-3.5 shrink-0" />
                  {user?.email}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
