import { useReverification, useUser } from '@clerk/clerk-react';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function clerkError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (Array.isArray(e['errors']) && e['errors'].length > 0) {
      const first = e['errors'][0] as Record<string, unknown>;
      return String(
        first['longMessage'] ?? first['message'] ?? 'Unknown error',
      );
    }
    if (typeof e['message'] === 'string') return e['message'];
  }
  return 'Unknown error';
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
        autoComplete="new-password"
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const { user, isLoaded } = useUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Keep a ref so the reverification wrapper always sees the latest values
  const formRef = useRef({ currentPassword, newPassword, hasPassword: false });
  formRef.current = {
    currentPassword,
    newPassword,
    hasPassword: user?.passwordEnabled ?? false,
  };

  const updatePasswordSecure = useReverification(async () => {
    const {
      currentPassword: cur,
      newPassword: next,
      hasPassword,
    } = formRef.current;
    await user!.updatePassword({
      currentPassword: hasPassword ? cur : undefined,
      newPassword: next,
      signOutOfOtherSessions: true,
    });
  });

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  const hasPassword = user.passwordEnabled;

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('Passwords do not match.'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('Password must be at least 8 characters.'));
      return;
    }
    setSaving(true);
    try {
      await updatePasswordSecure();
      toast.success(t('Password updated.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(clerkError(err));
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    (!hasPassword || currentPassword.length > 0);

  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Password')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Update your account password.')}
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">
          {hasPassword ? t('Change password') : t('Set a password')}
        </p>

        <div className="flex flex-col gap-4">
          {hasPassword && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-password" className="text-sm">
                {t('Current password')}
              </Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password" className="text-sm">
              {t('New password')}
            </Label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder={t('Min. 8 characters')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password" className="text-sm">
              {t('Confirm new password')}
            </Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" disabled={!isDirty || saving} onClick={handleSave}>
            {saving && <LoadingSpinner className="w-4 h-4 mr-2" />}
            {hasPassword ? t('Update password') : t('Set password')}
          </Button>
        </div>
      </div>
    </div>
  );
}
