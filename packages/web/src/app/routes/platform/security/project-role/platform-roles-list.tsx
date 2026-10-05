import { t } from 'i18next';

import { Panel, SettingRows } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
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
    <Panel flush>
      <SettingRows>
        {roleCopy
          .platformRoles({
            personalProjectsEnabled: platform.autoCreatePersonalProjects,
          })
          .map((platformRole) => (
            <Item key={platformRole.role} className="flex-nowrap items-center">
              <RoleAvatar name={platformRole.label} tone={platformRole.tone} />
              <ItemContent className="min-w-0">
                <ItemTitle className="min-w-0 max-w-full flex-wrap">
                  {platformRole.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" tabIndex={0}>
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
                </ItemTitle>
                <ItemDescription>{platformRole.description}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
      </SettingRows>
    </Panel>
  );
}
