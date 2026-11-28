import {
  EmailDomain,
  EmailDomainWithUsage,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';

import { adminLayout } from '@/app/components/admin';
import { DomainVerification } from '@/app/routes/platform/security/sso/domain-verification';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const VerifyDomainDialog = ({
  emailDomain,
  refetchPlatform,
  open,
  onOpenChange,
  onAdded,
  onLocked,
}: VerifyDomainDialogProps) => {
  const pending =
    emailDomain?.verificationStatus ===
    SsoDomainVerificationStatus.PENDING_VERIFICATION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={adminLayout.dialog.md}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {pending
              ? t('Verify {domain}', { domain: emailDomain.domain })
              : t('Add a domain')}
          </DialogTitle>
          <DialogDescription>
            {pending
              ? t(
                  'Add this TXT record at your DNS provider, then verify. Verify within 7 days or the domain is dropped.',
                )
              : t(
                  'People with an email at this domain follow the sign-in rules you set.',
                )}
          </DialogDescription>
        </DialogHeader>
        <DomainVerification
          emailDomain={emailDomain}
          refetchPlatform={refetchPlatform}
          onAdded={onAdded}
          onVerified={() => onOpenChange(false)}
          onLocked={() => {
            onOpenChange(false);
            onLocked();
          }}
          showIntro={false}
          secondaryAction={
            <Button
              type="button"
              variant="outline"
              data-testid="sso-domain-dialog-close"
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
  emailDomain: EmailDomainWithUsage | null;
  refetchPlatform: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (emailDomain: EmailDomain) => void;
  onLocked: () => void;
};
