import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, MoreHorizontal, Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import {
  AdminSection,
  SettingsPanel,
  SettingsRow,
  adminLayout,
} from '@/app/components/admin';
import { AddGuestDomainDialog } from '@/app/routes/platform/security/sso/add-guest-domain-dialog';
import { getVerifiedDomain } from '@/app/routes/platform/security/sso/verified-domain';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

export const GuestDomainsSection = ({
  platform,
  refetch,
}: GuestDomainsSectionProps) => {
  const domains = platform.allowedAuthDomains;
  const verifiedDomain = getVerifiedDomain(platform);

  return (
    <AdminSection
      title={t('Guest domains')}
      description={t(
        'Invite people from these domains into your platform. They can sign in with Google or email.',
      )}
      action={
        domains.length > 0 && (
          <AddGuestDomainDialog platform={platform} refetch={refetch}>
            <Button
              {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_OPEN)}
              size="sm"
              variant="outline"
            >
              <Plus />
              {t('Add a guest domain')}
            </Button>
          </AddGuestDomainDialog>
        )
      }
    >
      {domains.length === 0 ? (
        <SettingsPanel flush>
          <SettingsRow
            icon={<Globe />}
            title={t('No guest domains')}
            description={t('Add the domains of users you want to invite.')}
          >
            <AddGuestDomainDialog platform={platform} refetch={refetch}>
              <Button
                {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_OPEN)}
                size="sm"
                variant="outline"
              >
                {t('Add domain')}
              </Button>
            </AddGuestDomainDialog>
          </SettingsRow>
        </SettingsPanel>
      ) : (
        <>
          <SettingsPanel flush>
            {domains.map((domain) => (
              <SettingsRow key={domain} icon={<Globe />} title={domain}>
                <DropdownMenu modal={true}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('Actions for {domain}', { domain })}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ConfirmationDeleteDialog
                      title={t('Remove {domain}?', { domain })}
                      message={
                        domains.length === 1
                          ? t(
                              'With no domains left, people from any domain can be invited.',
                            )
                          : t('People at {domain} can no longer be invited.', {
                              domain,
                            })
                      }
                      entityName={domain}
                      buttonText={t('Remove domain')}
                      controlId={AdminControl.SSO_GUEST_DOMAIN_REMOVE_CONFIRM}
                      contentClassName={adminLayout.dialog.md}
                      keepOpenOnOutsideClick
                      showToast
                      mutationFn={async () => {
                        await removeGuestDomain({
                          platformId: platform.id,
                          domains,
                          domain,
                        });
                        await refetch();
                      }}
                      onError={(error) =>
                        toast.error(
                          api.extractServerErrorMessage(
                            error,
                            t("Couldn't remove domain"),
                          ),
                        )
                      }
                    >
                      <DropdownMenuItem
                        {...adminControl(
                          AdminControl.SSO_GUEST_DOMAIN_REMOVE_OPEN,
                        )}
                        variant="destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash className="size-4" />
                        {t('Remove domain')}
                      </DropdownMenuItem>
                    </ConfirmationDeleteDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SettingsRow>
            ))}
          </SettingsPanel>
          <p className="text-xs text-gray-11">
            {verifiedDomain
              ? t(
                  'Only people at {verifiedDomain} and these domains can be invited to the platform.',
                  { verifiedDomain },
                )
              : t(
                  'Only people at these domains can be invited to the platform.',
                )}
          </p>
        </>
      )}
    </AdminSection>
  );
};

async function removeGuestDomain({
  platformId,
  domains,
  domain,
}: {
  platformId: string;
  domains: string[];
  domain: string;
}): Promise<void> {
  const remaining = domains.filter((existing) => existing !== domain);
  await platformApi.update(
    {
      allowedAuthDomains: remaining,
      enforceAllowedAuthDomains: remaining.length > 0,
    },
    platformId,
  );
}

type GuestDomainsSectionProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
