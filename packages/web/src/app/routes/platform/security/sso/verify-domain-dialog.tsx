import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { adminLayout } from '@/app/components/admin';
import { DomainVerification } from '@/app/routes/platform/security/sso/domain-verification';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const VerifyDomainDialog = ({
  platform,
  refetch,
  open,
  onOpenChange,
  children,
}: VerifyDomainDialogProps) => {
  const pending =
    !!platform.ssoDomain &&
    platform.ssoDomainVerification?.status ===
      SsoDomainVerificationStatus.PENDING_VERIFICATION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className={adminLayout.dialog.md}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {pending
              ? t('Verify {domain}', { domain: platform.ssoDomain })
              : t('Verify a domain')}
          </DialogTitle>
          <DialogDescription>
            {pending
              ? t(
                  'Add this TXT record at your DNS provider, then verify. Verify within 7 days or the domain is dropped.',
                )
              : t(
                  'Prove your company owns its email domain with a DNS record.',
                )}
          </DialogDescription>
        </DialogHeader>
        <DomainVerification
          platform={platform}
          refetch={refetch}
          onVerified={() => onOpenChange(false)}
          showIntro={false}
          secondaryAction={
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {pending ? t('Verify later') : t('Cancel')}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

type VerifyDomainDialogProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
};
