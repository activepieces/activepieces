import {
  AP_MAXIMUM_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_ALLOWED_TYPES,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Camera, Mail } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { LanguageToggle } from '@/app/components/account-settings/language-toggle';
import { ThemeToggle } from '@/app/components/account-settings/theme-toggle';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Separator } from '@/components/ui/separator';
import { userHooks, userMutations } from '@/hooks/user-hooks';

export function AccountSettingsPage() {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <UserAvatar
            name={(user?.firstName ?? '') + ' ' + (user?.lastName ?? '')}
            email={user?.email ?? ''}
            size={72}
            disableTooltip
            imageUrl={user?.imageUrl}
          />
          <div
            data-theme="dark"
            className="absolute inset-0 flex items-center justify-center bg-scrim rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="h-5 w-5 text-gray-12" />
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
          <div className="text-base font-semibold">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-sm text-gray-11 flex items-center gap-1 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </div>
          <p className="text-xs text-gray-11 mt-1">
            {t('Click your avatar to upload a new picture.')}
          </p>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">{t('Appearance')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
