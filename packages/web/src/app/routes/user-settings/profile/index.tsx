import { useUser } from '@clerk/clerk-react';
import { t } from 'i18next';
import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ProfileSettingsPage() {
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  const displayFirstName = firstName || user.firstName || '';
  const displayLastName = lastName || user.lastName || '';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await user.setProfileImage({ file });
      toast.success(t('Profile photo updated.'));
    } catch {
      toast.error(t('Failed to update profile photo.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await user.update({
        firstName: displayFirstName,
        lastName: displayLastName,
      });
      toast.success(t('Profile updated.'));
    } catch {
      toast.error(t('Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    (firstName && firstName !== user.firstName) ||
    (lastName && lastName !== user.lastName);

  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Profile')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage your name and profile photo.')}
        </p>
      </div>

      <Separator />

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <img
            src={user.imageUrl}
            alt={user.fullName ?? ''}
            className="w-16 h-16 rounded-full object-cover"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {uploading ? (
              <LoadingSpinner className="w-5 h-5 text-white" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium">{user.fullName}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-primary hover:underline mt-0.5"
          >
            {t('Change photo')}
          </button>
        </div>
      </div>

      <Separator />

      {/* Name */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('First name')}</Label>
            <Input
              value={displayFirstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={user.firstName ?? ''}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('Last name')}</Label>
            <Input
              value={displayLastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={user.lastName ?? ''}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">{t('Email')}</Label>
          <Input
            value={user.primaryEmailAddress?.emailAddress ?? ''}
            disabled
            className="text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!isDirty || saving}
          onClick={handleSave}
        >
          {saving && <LoadingSpinner className="w-4 h-4 mr-2" />}
          {t('Save changes')}
        </Button>
      </div>
    </div>
  );
}
