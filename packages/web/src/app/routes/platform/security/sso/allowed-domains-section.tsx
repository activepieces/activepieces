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
import { AddAllowedDomainDialog } from '@/app/routes/platform/security/sso/add-allowed-domain-dialog';
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

export const AllowedDomainsSection = ({
  platform,
  refetch,
}: AllowedDomainsSectionProps) => {
  const domains = platform.allowedAuthDomains;

  return (
    <AdminSection
      title={t('Allowed domains')}
      description={t(
        'Limit who can join, and who can sign in with email and password, to the domains you add.',
      )}
      action={
        domains.length > 0 && (
          <AddAllowedDomainDialog platform={platform} refetch={refetch}>
            <Button
              {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_OPEN)}
              size="sm"
              variant="outline"
            >
              <Plus />
              {t('Add domain')}
            </Button>
          </AddAllowedDomainDialog>
        )
      }
    >
      {domains.length === 0 ? (
        <SettingsPanel flush>
          <SettingsRow
            icon={<Globe />}
            title={t('No allowed domains')}
            description={t(
              'Anyone can join or sign in with email and password until you add a domain.',
            )}
          >
            <AddAllowedDomainDialog platform={platform} refetch={refetch}>
              <Button
                {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_OPEN)}
                size="sm"
                variant="outline"
              >
                {t('Add domain')}
              </Button>
            </AddAllowedDomainDialog>
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
                              'With no domains left, anyone can join or sign in with email and password.',
                            )
                          : t(
                              'People at {domain} can no longer join or sign in with email and password.',
                              {
                                domain,
                              },
                            )
                      }
                      entityName={domain}
                      buttonText={t('Remove domain')}
                      controlId={AdminControl.SSO_ALLOWED_DOMAIN_REMOVE_CONFIRM}
                      contentClassName={adminLayout.dialog.md}
                      keepOpenOnOutsideClick
                      showToast
                      mutationFn={async () => {
                        await removeAllowedDomain({
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
                          AdminControl.SSO_ALLOWED_DOMAIN_REMOVE_OPEN,
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
            {t(
              "Add your company domain too, or people at your company can't join or sign in with email and password.",
            )}
          </p>
        </>
      )}
    </AdminSection>
  );
};

async function removeAllowedDomain({
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

type AllowedDomainsSectionProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};
