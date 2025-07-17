import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { MailCheck } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';
import { authenticationApi } from '@/lib/authentication-api';
import { CreateOtpRequestBody, OtpType } from '@activepieces/ee-shared';

const CheckEmailNote = ({ email, type }: CreateOtpRequestBody) => {
  const { mutate: resendVerification } = useMutation({
    mutationFn: authenticationApi.sendOtpEmail,
    onSuccess: () => {
      toast({
        title: t('Success'),
        description:
          type === OtpType.EMAIL_VERIFICATION
            ? t('Verification email resent, if previous one expired.')
            : t('Password reset link resent, if previous one expired.'),
      });
    },
  });
  return (
    <div className="gap-2 w-full flex flex-col">
      <div className="gap-4 w-full flex flex-row items-center justify-center">
        <MailCheck className="w-16 h-16" />
        <span className="text-left w-fit">
          {type === OtpType.EMAIL_VERIFICATION
            ? t('We sent you a link to complete your registration to')
            : t('We sent you a link to reset your password to')}
          <strong>&nbsp;{email}</strong>.
        </span>
      </div>
      <div className="flex flex-row gap-1">
        {t("Didn't receive an email or it expired?")}
        <button
          className="cursor-pointer text-primary underline"
          onClick={() =>
            resendVerification({
              email,
              type,
            })
          }
        >
          {t('Resend')}
        </button>
      </div>
    </div>
  );
};

CheckEmailNote.displayName = 'CheckEmailNote';
export { CheckEmailNote };
