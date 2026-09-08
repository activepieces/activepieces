import { isNil, RoleType } from '@activepieces/core-utils';
import { PlatformRole, UserStatus } from '@activepieces/shared';
import { t } from 'i18next';

import {
  platformUserHooks,
  projectRoleQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import {
  AdminOverview,
  OverviewCard,
  OverviewCards,
  OverviewEmpty,
  OverviewRow,
  OverviewRows,
  OverviewSection,
} from './overview-shell';

export function UsersOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: users, isLoading: isLoadingUsers } =
    platformUserHooks.useUsers();
  const { data: invitations, isLoading: isLoadingInvitations } =
    platformUserHooks.usePlatformInvitations();
  const { data: roles, isLoading: isLoadingRoles } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);

  const allUsers = users?.data ?? [];
  const admins = allUsers.filter(
    (user) => user.platformRole === PlatformRole.ADMIN,
  ).length;
  const deactivated = allUsers.filter(
    (user) => user.status === UserStatus.INACTIVE,
  ).length;
  const members = allUsers.length - admins;

  const googleEnabled = platform.googleAuthEnabled;
  const samlEnabled = !isNil(platform.federatedAuthProviders?.saml);
  const domains = platform.allowedAuthDomains ?? [];
  const signInMethods = [
    googleEnabled,
    platform.emailAuthEnabled,
    samlEnabled,
  ].filter(Boolean).length;

  const customRoles = (roles?.data ?? []).filter(
    (role) => role.type === RoleType.CUSTOM,
  ).length;
  const pending = invitations ?? [];

  return (
    <AdminOverview
      title={t('Users & access')}
      description={t(
        'Who can sign in, how they sign in, and what they can do inside projects.',
      )}
    >
      <OverviewCards>
        <OverviewCard
          to="/platform/users?tab=members"
          title={t('Members')}
          value={allUsers.length}
          isLoading={isLoadingUsers}
          description={t(
            '{admins, plural, =1 {# admin} other {# admins}} · {members, plural, =1 {# member} other {# members}} · {deactivated} deactivated',
            { admins, members, deactivated },
          )}
        />
        <OverviewCard
          to="/platform/users?tab=sso"
          title={t('Single sign on')}
          tier="team"
          value={t('{count} of 3', { count: signInMethods })}
          description={
            samlEnabled ? t('SAML connected.') : t('SAML not connected yet.')
          }
        />
        <OverviewCard
          to="/platform/users?tab=roles"
          title={t('Project roles')}
          tier="team"
          value={platform.plan.projectRolesEnabled ? customRoles : t('Locked')}
          isLoading={isLoadingRoles}
          description={
            customRoles === 0
              ? t('No custom roles. Built-in roles in use.')
              : t('Custom roles on top of the built-in ones.')
          }
        />
      </OverviewCards>

      <OverviewSection
        title={t('Sign-in policy')}
        description={t(
          'How people get into this platform. Individual providers are configured under Single sign on.',
        )}
      >
        <OverviewRows>
          <OverviewRow
            tone={googleEnabled ? 'ok' : 'off'}
            label={t('Google sign-in')}
          >
            {googleEnabled ? t('Enabled') : t('Off')}
          </OverviewRow>
          <OverviewRow
            tone={platform.emailAuthEnabled ? 'ok' : 'off'}
            label={t('Email and password')}
          >
            {platform.emailAuthEnabled ? t('Enabled') : t('Off')}
          </OverviewRow>
          <OverviewRow tone={samlEnabled ? 'ok' : 'off'} label={t('SAML 2.0')}>
            {samlEnabled ? t('Enabled') : t('Off')}
          </OverviewRow>
          <OverviewRow
            tone={domains.length > 0 ? 'ok' : 'off'}
            label={t('Allowed email domains')}
          >
            {domains.length > 0
              ? t('{count, plural, =1 {# domain} other {# domains}}', {
                  count: domains.length,
                })
              : t('Any domain')}
          </OverviewRow>
        </OverviewRows>
      </OverviewSection>

      <OverviewSection
        title={t('Pending invitations')}
        description={t(
          'Invites sent from any project that have not been accepted yet.',
        )}
      >
        {isLoadingInvitations || pending.length === 0 ? (
          <OverviewEmpty>{t('No pending invitations')}</OverviewEmpty>
        ) : (
          <OverviewRows>
            {pending.map((invitation) => (
              <OverviewRow
                key={invitation.id}
                tone="warn"
                label={invitation.email}
              />
            ))}
          </OverviewRows>
        )}
      </OverviewSection>
    </AdminOverview>
  );
}
