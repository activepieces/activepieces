import { CreateOtpRequestBody, OtpType } from '@activepieces/shared';
import { t } from 'i18next';
import { MailCheck } from 'lucide-react';
import { toast } from 'sonner';

import { authMutations } from '../hooks/auth-hooks';

const CheckEmailNote = ({ email, type }: CreateOtpRequestBody) => {
  const { mutate: resendVerification } = authMutations.useSendOtpEmail({
    onSuccess: () => {
      toast.success(
        type === OtpType.EMAIL_VERIFICATION
          ? t('Verification email resent, if previous one expired.')
          : t('Password reset link resent, if previous one expired.'),
        {
          duration: 3000,
        },
      );
    },
  });
  return (
    <div className="flex w-full flex-col gap-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-3 text-accent-11">
          <MailCheck className="size-4" />
        </div>
        <p className="text-gray-12">
          {type === OtpType.EMAIL_VERIFICATION
            ? t('We sent you a link to complete your registration to')
            : t('We sent you a link to reset your password to')}
          <span className="font-medium">&nbsp;{email}</span>.
        </p>
      </div>
      <p className="text-gray-11">
        {t("Didn't receive an email or it expired?")}{' '}
        <button
          type="button"
          className="font-medium text-gray-12 hover:underline"
          onClick={() =>
            resendVerification({
              email,
              type,
            })
          }
        >
          {t('Resend')}
        </button>
      </p>
    </div>
  );
};

CheckEmailNote.displayName = 'CheckEmailNote';
export { CheckEmailNote };
