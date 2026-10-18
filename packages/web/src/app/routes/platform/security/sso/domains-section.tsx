import {
  PlatformWithoutSensitiveData,
  SsoDomainVerification,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { FileText, MoreHorizontal, ShieldCheck, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AdminSection,
  SettingsPanel,
  SettingsRow,
  StatusDot,
  adminLayout,
} from '@/app/components/admin';
import { DomainDnsRecord } from '@/app/routes/platform/security/sso/domain-dns-record';
import { DomainStatusIcon } from '@/app/routes/platform/security/sso/domain-status-icon';
import { SamlDeletionWarning } from '@/app/routes/platform/security/sso/saml-deletion-warning';
import { useGoogleSignInAvailable } from '@/app/routes/platform/security/sso/use-google-sign-in-available';
import { VerifyDomainDialog } from '@/app/routes/platform/security/sso/verify-domain-dialog';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { samlSsoApi } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

export const DomainsSection = ({ platform, refetch }: DomainsSectionProps) => {
  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const [verifyOpen, setVerifyOpen] = useState(false);

  return (
    <AdminSection
      title={t('Domain')}
      description={t(
        "Verify your company's email domain to set up single sign-on.",
      )}
    >
      {platform.ssoDomain && platform.ssoDomainVerification ? (
        <SettingsPanel flush>
          <DomainRow
            platform={platform}
            refetch={refetch}
            domain={platform.ssoDomain}
            verification={platform.ssoDomainVerification}
            samlConnected={samlConnected}
            onContinueVerifying={() => setVerifyOpen(true)}
          />
        </SettingsPanel>
      ) : (
        <SettingsPanel flush>
          <SettingsRow
            media={<DomainStatusIcon status="none" />}
            title={t('No domain verified')}
            description={t('Verify the domain your people sign in with.')}
          >
            <Button
              {...adminControl(AdminControl.SSO_DOMAIN_ADD_OPEN)}
              size="sm"
              onClick={() => setVerifyOpen(true)}
            >
              {t('Verify domain')}
            </Button>
          </SettingsRow>
        </SettingsPanel>
      )}
      <VerifyDomainDialog
        platform={platform}
        refetch={refetch}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
      />
    </AdminSection>
  );
};

const DomainRow = ({
  platform,
  refetch,
  domain,
  verification,
  samlConnected,
  onContinueVerifying,
}: DomainRowProps) => {
  const googleSignInAvailable = useGoogleSignInAvailable();
  const [dnsRecordOpen, setDnsRecordOpen] = useState(false);
  const verified = verification.status === SsoDomainVerificationStatus.VERIFIED;

  return (
    <SettingsRow
      media={<DomainStatusIcon status={verified ? 'verified' : 'pending'} />}
      title={domain}
      description={
        verified
          ? undefined
          : t(
              "Verification in progress. Add the TXT record within 3 hours or it's dropped.",
            )
      }
    >
      <StatusDot
        tone={verified ? 'success' : 'warning'}
        className="text-xs text-gray-11"
      >
        {verified ? t('Verified') : t('Verifying')}
      </StatusDot>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Domain actions')}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {verified ? (
            <DropdownMenuItem
              {...adminControl(AdminControl.SSO_DOMAIN_DNS_RECORD_OPEN)}
              onSelect={() => setDnsRecordOpen(true)}
            >
              <FileText className="size-4" />
              {t('View DNS record')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              {...adminControl(AdminControl.SSO_DOMAIN_VERIFY_OPEN)}
              onSelect={onContinueVerifying}
            >
              <ShieldCheck className="size-4" />
              {t('Continue verifying')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <ConfirmationDeleteDialog
            title={
              !verified
                ? t('Cancel verifying {domain}?', { domain })
                : samlConnected
                ? t('Remove {domain} and delete your SAML connection?', {
                    domain,
                  })
                : t('Remove {domain}?', { domain })
            }
            message={
              verified
                ? samlConnected
                  ? t(
                      'People who use single sign-on will have to sign in another way.',
                    )
                  : t(
                      "To set up single sign-on later, you'll need to verify the domain again with a new DNS record.",
                    )
                : t(
                    'The domain and its DNS record are discarded. You can start again anytime.',
                  )
            }
            warning={
              verified && samlConnected ? (
                <SamlDeletionWarning
                  otherMethodsOff={
                    !platform.emailAuthEnabled && !googleSignInAvailable
                  }
                />
              ) : undefined
            }
            entityName={domain}
            buttonText={
              !verified
                ? t('Cancel verification')
                : samlConnected
                ? t('Remove domain and disable SAML')
                : t('Remove domain')
            }
            controlId={AdminControl.SSO_DOMAIN_REMOVE_CONFIRM}
            contentClassName={adminLayout.dialog.md}
            keepOpenOnOutsideClick
            showToast={verified}
            mutationFn={async () => {
              await samlSsoApi.updateSsoDomain(null);
              await refetch();
            }}
            onError={(error) => {
              refetch().catch(() => undefined);
              toast.error(
                api.extractServerErrorMessage(
                  error,
                  t("Couldn't remove domain"),
                ),
              );
            }}
          >
            <DropdownMenuItem
              {...adminControl(AdminControl.SSO_DOMAIN_REMOVE_OPEN)}
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash className="size-4" />
              {verified ? t('Remove domain') : t('Cancel verification')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={dnsRecordOpen} onOpenChange={setDnsRecordOpen}>
        <DialogContent
          className={adminLayout.dialog.md}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {t('DNS record for {domain}', { domain })}
            </DialogTitle>
            <DialogDescription>
              {t('Add this TXT record at your DNS provider.')}
            </DialogDescription>
          </DialogHeader>
          <DomainDnsRecord record={verification.record} />
        </DialogContent>
      </Dialog>
    </SettingsRow>
  );
};

type DomainsSectionProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};

type DomainRowProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  domain: string;
  verification: SsoDomainVerification;
  samlConnected: boolean;
  onContinueVerifying: () => void;
};
