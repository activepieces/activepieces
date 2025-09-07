import { t } from 'i18next';

import { useEmbedding } from '@/components/embed-provider';
import { SidebarHeader } from '@/components/ui/sidebar-shadcn';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

export const AppSidebarHeader = () => {
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const branding = flagsHooks.useWebsiteBranding();
  const showSwitcher =
    edition !== ApEdition.COMMUNITY && !embedState.isEmbedded;

  return (
    <SidebarHeader>
      {showSwitcher ? (
        <ProjectSwitcher />
      ) : (
        <img
          src={branding.logos.fullLogoUrl}
          alt={t('home')}
          className="object-contain w-40"
        />
      )}
    </SidebarHeader>
  );
};
