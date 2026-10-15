import {
  PlatformWithoutSensitiveData,
  SsoDomainVerification,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Check,
  Clock,
  FileText,
  Globe,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AdminSection,
  SettingsPanel,
  SettingsRow,
  StatusDot,
  adminLayout,
} from '@/app/components/admin';
import { AddDomainDialog } from '@/app/routes/platform/security/sso/add-domain-dialog';
import { DomainDnsRecord } from '@/app/routes/platform/security/sso/domain-dns-record';
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
import { samlSsoApi, ssoMutations } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export const DomainsSection = ({ platform, refetch }: DomainsSectionProps) => {
  const samlConnected = !!platform.federatedAuthProviders?.saml;

  return (
    <AdminSection
      title={t('Domains')}
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
          />
        </SettingsPanel>
      ) : (
        <SettingsPanel flush>
          <SettingsRow
            icon={<Globe />}
            title={t('No domains yet')}
            description={t('Add the domain your people sign in with.')}
          >
            <AddDomainDialog platform={platform} refetch={refetch}>
              <Button
                {...adminControl(AdminControl.SSO_DOMAIN_ADD_OPEN)}
                size="sm"
              >
                <Plus />
                {t('Add domain')}
              </Button>
            </AddDomainDialog>
          </SettingsRow>
        </SettingsPanel>
      )}
    </AdminSection>
  );
};

const DomainRow = ({
  platform,
  refetch,
  domain,
  verification,
  samlConnected,
}: DomainRowProps) => {
  const [dnsRecordOpen, setDnsRecordOpen] = useState(false);
  const verified = verification.status === SsoDomainVerificationStatus.VERIFIED;
  const { mutate: verifyDomain, isPending: isVerifying } =
    ssoMutations.useVerifySsoDomain({ refetch });

  return (
    <SettingsRow
      media={
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg [&_svg]:size-4',
            verified
              ? 'bg-success-3 text-success-11'
              : 'bg-warning-3 text-warning-11',
          )}
        >
          {verified ? <Check /> : <Clock />}
        </div>
      }
      title={domain}
      description={
        verified
          ? undefined
          : t("Add the TXT record within 3 hours or it's dropped.")
      }
    >
      <StatusDot
        tone={verified ? 'success' : 'warning'}
        className="text-xs text-gray-11"
      >
        {verified ? t('Verified') : t('Pending DNS')}
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
          <DropdownMenuItem
            {...adminControl(AdminControl.SSO_DOMAIN_DNS_RECORD_OPEN)}
            onSelect={() => setDnsRecordOpen(true)}
          >
            <FileText className="size-4" />
            {t('View DNS record')}
          </DropdownMenuItem>
          {!verified && (
            <DropdownMenuItem
              {...adminControl(AdminControl.SSO_DOMAIN_DNS_RUN)}
              disabled={isVerifying}
              onSelect={() => verifyDomain()}
            >
              <RefreshCw className="size-4" />
              {t('Check DNS again')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <ConfirmationDeleteDialog
            title={
              samlConnected
                ? t('Remove {domain} and delete your SAML connection?', {
                    domain,
                  })
                : t('Remove {domain}?', { domain })
            }
            message={
              <RemoveDomainConsequences
                samlConnected={samlConnected}
                emailAuthEnabled={platform.emailAuthEnabled}
              />
            }
            entityName={domain}
            buttonText={
              samlConnected
                ? t('Remove domain and disable SAML')
                : t('Remove domain')
            }
            controlId={AdminControl.SSO_DOMAIN_REMOVE_CONFIRM}
            contentClassName={adminLayout.dialog.md}
            keepOpenOnOutsideClick
            showToast
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
              {t('Remove domain')}
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

const RemoveDomainConsequences = ({
  samlConnected,
  emailAuthEnabled,
}: {
  samlConnected: boolean;
  emailAuthEnabled: boolean;
}) => {
  if (!samlConnected) {
    return t(
      "To set up single sign-on later, you'll need to verify the domain again with a new DNS record.",
    );
  }
  return (
    <span className="flex flex-col gap-2">
      <span>
        {t('This disables single sign-on and deletes its SAML connection.')}
      </span>
      {!emailAuthEnabled && (
        <span>
          {t('Email sign-in is off. Turn it on first if they need it.')}
        </span>
      )}
    </span>
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
};
