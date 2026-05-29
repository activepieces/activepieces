import { useReverification, useUser } from '@clerk/clerk-react';
import { t } from 'i18next';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type UserResource = NonNullable<ReturnType<typeof useUser>['user']>;
type EmailAddressResource = UserResource['emailAddresses'][number];

type VerifyState = {
  id: string;
  code: string;
  verifying: boolean;
};

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

export default function ContactSettingsPage() {
  const { user, isLoaded } = useUser();
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verify, setVerify] = useState<VerifyState | null>(null);

  const newEmailRef = useRef(newEmail);
  newEmailRef.current = newEmail;

  const createEmailSecure = useReverification(async () => {
    const result = await user!.createEmailAddress({
      email: newEmailRef.current.trim(),
    });
    await result.prepareVerification({ strategy: 'email_code' });
    return result;
  });

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setSubmitting(true);
    try {
      const result = await createEmailSecure();
      setVerify({ id: result.id, code: '', verifying: false });
      setAdding(false);
      setNewEmail('');
    } catch (err) {
      toast.error(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (emailAddr: EmailAddressResource) => {
    if (!verify) return;
    setVerify((v) => v && { ...v, verifying: true });
    try {
      await emailAddr.attemptVerification({ code: verify.code });
      toast.success(t('Email verified.'));
      setVerify(null);
    } catch (err) {
      toast.error(clerkError(err));
    } finally {
      setVerify((v) => v && { ...v, verifying: false });
    }
  };

  const handleRemove = async (emailAddr: EmailAddressResource) => {
    try {
      await emailAddr.destroy();
      toast.success(t('Email removed.'));
    } catch (err) {
      toast.error(clerkError(err));
    }
  };

  const handleMakePrimary = async (emailAddr: EmailAddressResource) => {
    try {
      await user.update({ primaryEmailAddressId: emailAddr.id });
      toast.success(t('Primary email updated.'));
    } catch (err) {
      toast.error(clerkError(err));
    }
  };

  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Email')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage your email addresses.')}
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('Email addresses')}</p>
          {!adding && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('Add email')}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {user.emailAddresses.map((emailAddr) => {
            const isPrimary = emailAddr.id === user.primaryEmailAddressId;
            const needsVerify =
              verify?.id === emailAddr.id &&
              emailAddr.verification.status !== 'verified';

            return (
              <div key={emailAddr.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="flex-1 truncate">
                    {emailAddr.emailAddress}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPrimary && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0"
                      >
                        {t('Primary')}
                      </Badge>
                    )}
                    {emailAddr.verification.status === 'verified' ? (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 text-emerald-500 border-emerald-500/30"
                      >
                        {t('Verified')}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 text-yellow-500 border-yellow-500/30"
                      >
                        {t('Unverified')}
                      </Badge>
                    )}
                    {!isPrimary &&
                      emailAddr.verification.status === 'verified' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleMakePrimary(emailAddr)}
                        >
                          {t('Make primary')}
                        </Button>
                      )}
                    {!isPrimary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(emailAddr)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {needsVerify && (
                  <div className="flex items-center gap-2 pl-2">
                    <Input
                      className="h-8 w-40 text-sm"
                      placeholder={t('Enter code')}
                      value={verify.code}
                      onChange={(e) =>
                        setVerify((v) => v && { ...v, code: e.target.value })
                      }
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={verify.verifying}
                      onClick={() => handleVerify(emailAddr)}
                    >
                      {verify.verifying ? (
                        <LoadingSpinner className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setVerify(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {adding && (
            <div className="flex items-center gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                placeholder={t('New email address')}
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <Button
                size="sm"
                className="h-8"
                disabled={submitting}
                onClick={handleAdd}
              >
                {submitting ? (
                  <LoadingSpinner className="w-3.5 h-3.5" />
                ) : (
                  t('Add')
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setAdding(false);
                  setNewEmail('');
                }}
              >
                {t('Cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
