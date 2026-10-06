import {
  AP_MAXIMUM_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_ALLOWED_TYPES,
} from '@activepieces/shared';
import { Camera01Icon } from '@hugeicons/core-free-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef } from 'react';
import { toast } from 'sonner';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Panel, SettingRows } from '@/components/custom/panel';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { userHooks, userMutations } from '@/hooks/user-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

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
      toast.success(t('Profile picture updated'));
    },
    onError: (error: Error) => {
      mutationFeedback.error({
        error,
        title: t("Couldn't update your profile picture"),
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploadMutation.isPending) {
      return;
    }
    if (file.size > AP_MAXIMUM_PROFILE_PICTURE_SIZE) {
      toast.error(t('File size exceeds 5MB limit'));
      return;
    }
    if (!PROFILE_PICTURE_ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP'));
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const email = user?.email ?? '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="md" className="gap-6">
        <DialogHeader>
          <DialogTitle>{t('Account settings')}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('Change profile picture')}
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-gray-8/50 disabled:cursor-not-allowed"
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
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-full bg-scrim opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
                uploadMutation.isPending && 'opacity-100',
              )}
            >
              {uploadMutation.isPending ? (
                <Spinner className="text-gray-12" />
              ) : (
                <HugeiconsIcon
                  icon={Camera01Icon}
                  className="size-4 text-gray-12"
                />
              )}
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

        <Panel flush>
          <SettingRows>
            <ThemeToggle />
            <LanguageToggle />
          </SettingRows>
        </Panel>
      </DialogContent>
    </Dialog>
  );
}

export interface AccountSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}
