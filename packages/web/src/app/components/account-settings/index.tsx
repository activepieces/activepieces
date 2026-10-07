import {
  AP_MAXIMUM_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_ALLOWED_TYPES,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Camera } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { userHooks, userMutations } from '@/hooks/user-hooks';

import { LanguageToggle } from './language-toggle';
import { ThemeToggle } from './theme-toggle';

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

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const email = user?.email ?? '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader>
          <DialogTitle>{t('Account Settings')}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('Upload File')}
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50 disabled:cursor-not-allowed"
            onClick={handleAvatarClick}
            disabled={uploadMutation.isPending}
          >
            <UserAvatar
              name={fullName}
              email={email}
              size={40}
              disableTooltip
              imageUrl={user?.imageUrl}
            />
            <span
              data-theme="dark"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-scrim opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Camera className="size-4 text-gray-12" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <TextWithTooltip tooltipMessage={fullName}>
              <p className="truncate text-sm font-medium text-gray-12">
                {fullName}
              </p>
            </TextWithTooltip>
            <TextWithTooltip tooltipMessage={email}>
              <p className="truncate text-xs text-gray-11">{email}</p>
            </TextWithTooltip>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-gray-6 rounded-lg border border-gray-6">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface AccountSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}
