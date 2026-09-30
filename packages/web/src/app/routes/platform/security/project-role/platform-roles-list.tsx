import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import { roleCopy } from '@/features/members/lib/role-copy';
import { platformHooks } from '@/hooks/platform-hooks';

import { RoleAvatar } from './role-avatar';

export function PlatformRolesList() {
  const { platform } = platformHooks.useCurrentPlatform();

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup className="gap-2">
        {roleCopy
          .platformRoles({
            personalProjectsEnabled: platform.autoCreatePersonalProjects,
          })
          .map((platformRole) => (
            <Item
              key={platformRole.role}
              variant="outline"
              size="sm"
              className="flex-nowrap bg-panel"
            >
              <RoleAvatar name={platformRole.label} tone={platformRole.tone} />
              <ItemContent className="min-w-0">
                <ItemTitle className="min-w-0 max-w-full flex-wrap">
                  {platformRole.label}
                  <Badge variant="secondary" className="text-sm ">
                    {t('Built in')}
                  </Badge>
                  {platformRole.isDefaultForNewMembers && (
                    <Badge variant="info" className="text-sm ">
                      {t('Default for new people')}
                    </Badge>
                  )}
                </ItemTitle>
                <ItemDescription>{platformRole.description}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
      </ItemGroup>
      <p className="text-sm text-gray-11">
        {t("Everyone has exactly one. To change someone's, open")}{' '}
        <Link
          to="/platform/users"
          className="text-accent-11 underline underline-offset-4"
        >
          {t('Users')} →
        </Link>
      </p>
    </div>
  );
}
