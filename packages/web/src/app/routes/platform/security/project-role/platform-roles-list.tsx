import { t } from 'i18next';
import { Link } from 'react-router-dom';

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
    <div className="flex flex-col gap-3">
      <Panel flush>
        <SettingRows>
          {roleCopy
            .platformRoles({
              personalProjectsEnabled: platform.autoCreatePersonalProjects,
            })
            .map((platformRole) => (
              <Item key={platformRole.role} className="flex-nowrap items-start">
                <RoleAvatar
                  name={platformRole.label}
                  tone={platformRole.tone}
                />
                <ItemContent className="min-w-0">
                  <ItemTitle className="min-w-0 max-w-full flex-wrap">
                    {platformRole.label}
                    <Badge variant="secondary">{t('Built in')}</Badge>
                    {platformRole.isDefaultForNewMembers && (
                      <Badge variant="info">
                        {t('Default for new people')}
                      </Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>{platformRole.description}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
        </SettingRows>
      </Panel>
      <p className="text-sm text-gray-11">
        {t("Built in — platform roles can't be added or changed.")}{' '}
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
