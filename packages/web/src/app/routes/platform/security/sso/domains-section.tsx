import {
  EmailDomainWithUsage,
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import dayjs from 'dayjs';
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
import {
  AddDomainButton,
  MultipleDomainsUpsell,
} from '@/app/routes/platform/security/sso/add-domain-button';
import { DomainDnsRecord } from '@/app/routes/platform/security/sso/domain-dns-record';
import { DomainStatusIcon } from '@/app/routes/platform/security/sso/domain-status-icon';
import { SamlDeletionWarning } from '@/app/routes/platform/security/sso/saml-deletion-warning';
import { useSignInMethods } from '@/app/routes/platform/security/sso/use-sign-in-methods';
import { VerifyDomainDialog } from '@/app/routes/platform/security/sso/verify-domain-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LockedGem } from '@/features/billing';
import {
  emailDomainMutations,
  emailDomainQueries,
} from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { DomainVerificationStatus } from '@/lib/statuses';

export const DomainsSection = ({ platform, refetch }: DomainsSectionProps) => {
  const samlConnected = !!platform.federatedAuthProviders?.saml;
  const { cloud } = useSignInMethods(platform);
  const {
    data: domains,
    isError,
    refetch: refetchDomains,
  } = emailDomainQueries.useEmailDomains();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDomainId, setDialogDomainId] = useState<string | null>(null);
  const [lockedOpen, setLockedOpen] = useState(false);
  const verifiedCount =
    domains?.filter(
      (emailDomain) =>
        emailDomain.verificationStatus === SsoDomainVerificationStatus.VERIFIED,
    ).length ?? 0;
  const verifyLocked =
    !platform.plan.multipleEmailDomainsEnabled && verifiedCount > 0;
  const addLocked =
    !platform.plan.multipleEmailDomainsEnabled && (domains?.length ?? 0) > 0;
  const dialogDomain =
    domains?.find((emailDomain) => emailDomain.id === dialogDomainId) ?? null;

  const openDialog = (id: string | null) => {
    setDialogDomainId(id);
    setDialogOpen(true);
  };

  return (
    <AdminSection
      title={t('Domains')}
      description={
        cloud
          ? t(
              "Verify your company's email domain to control how its people sign in.",
            )
          : t("Verify your company's email domain to set up single sign-on.")
      }
      action={
        <AddDomainButton
          locked={addLocked}
          lockedOpen={lockedOpen}
          onLockedOpenChange={setLockedOpen}
          onAdd={() => openDialog(null)}
        />
      }
    >
      {isError ? (
        <DataFetchErrorState
          entity={t('domains')}
          onRetry={() => refetchDomains()}
        />
      ) : (
        <SettingsPanel flush>
          {domains?.length === 0 && (
            <SettingsRow
              media={<DomainStatusIcon status="none" />}
              title={t('No domain verified')}
              description={t('Verify the domain your people sign in with.')}
            />
          )}
          {domains?.map((emailDomain) => (
            <DomainRow
              key={emailDomain.id}
              platform={platform}
              refetchPlatform={refetch}
              emailDomain={emailDomain}
              samlConnected={samlConnected}
              lastVerifiedDomain={verifiedCount === 1}
              verifyLocked={verifyLocked}
              onContinueVerifying={() => openDialog(emailDomain.id)}
            />
          ))}
        </SettingsPanel>
      )}
      <VerifyDomainDialog
        emailDomain={dialogDomain}
        refetchPlatform={refetch}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdded={(emailDomain) => setDialogDomainId(emailDomain.id)}
        onLocked={async () => {
          setLockedOpen(true);
          await refetch();
        }}
      />
    </AdminSection>
  );
};

const DomainRow = ({
  platform,
  refetchPlatform,
  emailDomain,
  samlConnected,
  lastVerifiedDomain,
  verifyLocked,
  onContinueVerifying,
}: DomainRowProps) => {
  const { cloud, isOnlyWorkingMethod } = useSignInMethods(platform);
  const samlIsOnlyMethod = isOnlyWorkingMethod('saml');
  const [dnsRecordOpen, setDnsRecordOpen] = useState(false);
  const { mutateAsync: removeDomain } =
    emailDomainMutations.useRemoveEmailDomain({ refetchPlatform });
  const domain = emailDomain.domain;
  const verified =
    emailDomain.verificationStatus === SsoDomainVerificationStatus.VERIFIED;
  const removesSaml = verified && samlConnected && lastVerifiedDomain;
  const locked = !verified && verifyLocked;
  const [upsellOpen, setUpsellOpen] = useState(false);
  const day = Math.min(7, dayjs().diff(emailDomain.created, 'day') + 1);
  const subtitle = locked
    ? t('Your plan includes one verified domain · removed after day 7')
    : !verified
    ? t('Waiting for DNS · day {day} of 7', { day })
    : emailDomain.peopleCount > 0
    ? t('domainPeopleCount', { count: emailDomain.peopleCount })
    : undefined;
  const losesSso =
    verified &&
    samlConnected &&
    emailDomain.peopleCount > 0 &&
    (removesSaml || cloud)
      ? t('domainRemoveLosesSso', { count: emailDomain.peopleCount, domain })
      : undefined;

  return (
    <SettingsRow
      media={
        <DomainStatusIcon
          status={verified ? 'verified' : locked ? 'locked' : 'pending'}
        />
      }
      title={domain}
      description={subtitle && <span className="text-xs">{subtitle}</span>}
    >
      {locked ? (
        <Popover open={upsellOpen} onOpenChange={setUpsellOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <LockedGem className="text-accent-11" />
              {t('Upgrade your plan')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="flex w-80 flex-col gap-4">
            <MultipleDomainsUpsell onAction={() => setUpsellOpen(false)} />
          </PopoverContent>
        </Popover>
      ) : (
        <StatusDot
          status={
            verified
              ? DomainVerificationStatus.VERIFIED
              : DomainVerificationStatus.VERIFYING
          }
          className="text-xs text-gray-11"
        >
          {verified ? t('Verified') : t('Verifying')}
        </StatusDot>
      )}
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Domain actions')}
            data-testid="sso-domain-actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!locked && (
            <>
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
            </>
          )}
          <ConfirmationDeleteDialog
            title={
              !verified
                ? t('Cancel verifying {domain}?', { domain })
                : removesSaml
                ? t('Remove {domain} and delete your SAML connection?', {
                    domain,
                  })
                : t('Remove {domain}?', { domain })
            }
            message={describeRemovingDomain({
              domain,
              verified,
              samlConnected,
              removesSaml,
              cloud,
            })}
            warning={
              removesSaml ? (
                <span className="flex flex-col gap-1">
                  {losesSso && <span>{losesSso}</span>}
                  <SamlDeletionWarning blocked={samlIsOnlyMethod} />
                </span>
              ) : (
                losesSso
              )
            }
            confirmText={verified ? domain : undefined}
            confirmDisabled={removesSaml && samlIsOnlyMethod}
            entityName={domain}
            buttonText={
              !verified
                ? t('Cancel verification')
                : removesSaml
                ? t('Remove domain and disable SAML')
                : t('Remove domain')
            }
            controlId={AdminControl.SSO_DOMAIN_REMOVE_CONFIRM}
            confirmTestId="sso-domain-remove-confirm"
            contentClassName={adminLayout.dialog.md}
            keepOpenOnOutsideClick
            showToast={verified}
            mutationFn={() => removeDomain(emailDomain.id)}
            onError={(error) => {
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
              data-testid="sso-domain-remove"
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
          <DomainDnsRecord emailDomain={emailDomain} />
        </DialogContent>
      </Dialog>
    </SettingsRow>
  );
};

function describeRemovingDomain({
  domain,
  verified,
  samlConnected,
  removesSaml,
  cloud,
}: DescribeRemovingDomainParams): string {
  if (!verified) {
    return t(
      'The domain and its DNS record are discarded. You can start again anytime.',
    );
  }
  if (cloud) {
    if (removesSaml) {
      return t(
        "Single sign-on will stop working, and you'll lose control of how people at {domain} sign in until you verify it again with a new DNS record.",
        { domain },
      );
    }
    if (samlConnected) {
      return t(
        'People at {domain} stop following your sign-in rules. Single sign-on stays on for your other verified domains.',
        { domain },
      );
    }
    return t(
      "You'll lose control of how people at {domain} sign in until you verify it again with a new DNS record.",
      { domain },
    );
  }
  if (removesSaml) {
    return t('People who use single sign-on will have to sign in another way.');
  }
  if (samlConnected) {
    return t(
      "Single sign-on stays on. To verify {domain} again, you'll need a new DNS record.",
      { domain },
    );
  }
  return t(
    "To set up single sign-on later, you'll need to verify the domain again with a new DNS record.",
  );
}

type DomainsSectionProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};

type DomainRowProps = {
  platform: PlatformWithoutSensitiveData;
  refetchPlatform: () => Promise<void>;
  emailDomain: EmailDomainWithUsage;
  samlConnected: boolean;
  lastVerifiedDomain: boolean;
  verifyLocked: boolean;
  onContinueVerifying: () => void;
};

type DescribeRemovingDomainParams = {
  domain: string;
  verified: boolean;
  samlConnected: boolean;
  removesSaml: boolean;
  cloud: boolean;
};
