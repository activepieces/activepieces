import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { SettingsPanel, SettingsRow } from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { roleCopy } from '@/features/members/lib/role-copy';
import { platformHooks } from '@/hooks/platform-hooks';

import { RoleAvatar } from './role-avatar';

export function PlatformRolesList() {
  const { platform } = platformHooks.useCurrentPlatform();

  return (
    <div className="flex flex-col gap-4">
      <SettingsPanel flush>
        {roleCopy
          .platformRoles({
            personalProjectsEnabled: platform.autoCreatePersonalProjects,
          })
          .map((platformRole) => (
            <SettingsRow
              key={platformRole.role}
              media={
                <RoleAvatar
                  name={platformRole.label}
                  tone={platformRole.tone}
                  className="rounded-lg"
                />
              }
              title={
                <>
                  {platformRole.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        tabIndex={0}
                        variant="secondary"
                        className="focus-visible:ring-[1px] focus-visible:ring-gray-8/50 focus-visible:outline-none"
                      >
                        {t('Built in')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('Platform roles cannot be added or changed')}
                    </TooltipContent>
                  </Tooltip>
                  {platformRole.isDefaultForNewMembers && (
                    <Badge variant="info">{t('Default for new people')}</Badge>
                  )}
                </>
              }
              description={platformRole.description}
            />
          ))}
      </SettingsPanel>
      <p className="text-xs text-gray-11">
        {t("Everyone has exactly one. To change someone's, open")}{' '}
        <Link
          to="/platform/users"
          className="text-accent-11 underline underline-offset-4"
        >
          {t('Members')} →
        </Link>
      </p>
    </div>
  );
}
