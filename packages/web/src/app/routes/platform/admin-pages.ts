import { ApEdition, PlatformWithoutSensitiveData } from '@activepieces/shared';
import React, { ComponentType } from 'react';

import { FeatureTeaserProps } from '@/app/components/feature-teaser';
import { FrameIcon } from '@/components/icons/frame';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { SettingsIcon } from '@/components/icons/settings';
import { ShieldIcon } from '@/components/icons/shield';
import { SparklesIcon } from '@/components/icons/sparkles';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { Error as BillingError, Success } from '@/features/billing';

const UsersOverview = React.lazy(() =>
  import('./overview/users-overview').then((m) => ({
    default: m.UsersOverview,
  })),
);
const ConnectionsOverview = React.lazy(() =>
  import('./overview/connections-overview').then((m) => ({
    default: m.ConnectionsOverview,
  })),
);
const AiOverview = React.lazy(() =>
  import('./overview/ai-overview').then((m) => ({ default: m.AiOverview })),
);
const SecurityOverview = React.lazy(() =>
  import('./overview/security-overview').then((m) => ({
    default: m.SecurityOverview,
  })),
);
const BillingOverview = React.lazy(() =>
  import('./overview/billing-overview').then((m) => ({
    default: m.BillingOverview,
  })),
);
const InfrastructureOverview = React.lazy(() =>
  import('./overview/infrastructure-overview').then((m) => ({
    default: m.InfrastructureOverview,
  })),
);
const ProjectsPage = React.lazy(() => import('./projects'));
const UsersPage = React.lazy(() => import('./users'));
const PlatformConnectionsPage = React.lazy(() => import('./connections'));
const GeneralPage = React.lazy(() =>
  import('./setup/general').then((m) => ({ default: m.GeneralPage })),
);
const ProvidersTab = React.lazy(() =>
  import('./setup/ai/providers-tab').then((m) => ({ default: m.ProvidersTab })),
);
const CapabilitiesTab = React.lazy(() =>
  import('./setup/ai/capabilities-tab').then((m) => ({
    default: m.CapabilitiesTab,
  })),
);
const PlatformMcpPage = React.lazy(() => import('./setup/mcp'));
const GlobalConnectionsTable = React.lazy(() =>
  import('./setup/connections').then((m) => ({
    default: m.GlobalConnectionsTable,
  })),
);
const PiecesListTab = React.lazy(() =>
  import('./setup/pieces').then((m) => ({ default: m.PiecesListTab })),
);
const PieceSetsTab = React.lazy(() =>
  import('./setup/pieces/piece-sets/piece-sets-tab').then((m) => ({
    default: m.PieceSetsTab,
  })),
);
const PieceSetDetailsPage = React.lazy(() =>
  import('./setup/pieces/piece-sets/piece-set-details-page').then((m) => ({
    default: m.PieceSetDetailsPage,
  })),
);
const PlatformTemplatesPage = React.lazy(() =>
  import('./setup/templates').then((m) => ({
    default: m.PlatformTemplatesPage,
  })),
);
const BillingPlanTab = React.lazy(() =>
  import('./billing').then((m) => ({ default: m.BillingPlanTab })),
);
const BillingUsageTab = React.lazy(() =>
  import('./billing').then((m) => ({ default: m.BillingUsageTab })),
);
const SSOPage = React.lazy(() =>
  import('./security/sso').then((m) => ({ default: m.SSOPage })),
);
const ProjectRolePage = React.lazy(() =>
  import('./security/project-role').then((m) => ({
    default: m.ProjectRolePage,
  })),
);
const ApiKeysPage = React.lazy(() =>
  import('./security/api-keys').then((m) => ({ default: m.ApiKeysPage })),
);
const SecretManagersPage = React.lazy(
  () => import('./security/secret-managers'),
);
const AuditLogsPage = React.lazy(() => import('./security/audit-logs'));
const EmbedPage = React.lazy(() =>
  import('./security/embed').then((m) => ({ default: m.EmbedPage })),
);
const SettingsWorkersPage = React.lazy(() => import('./infra/workers'));
const SettingsHealthPage = React.lazy(() => import('./infra/health'));
const ConfigurationsPage = React.lazy(() =>
  import('./infra/configurations').then((m) => ({
    default: m.ConfigurationsPage,
  })),
);
const TriggerHealthPage = React.lazy(() => import('./infra/triggers'));
const EventDestinationsPage = React.lazy(
  () => import('./infra/event-destinations'),
);

function isCommunity({ edition }: AdminPageContext) {
  return edition === ApEdition.COMMUNITY;
}

function hasNav(page: AdminPage): page is AdminNavPage {
  return page.nav !== undefined;
}

function visibleNavPages(context: AdminPageContext) {
  return ADMIN_PAGES.filter(hasNav).filter(
    (page) => page.nav.isHidden?.(context) !== true,
  );
}

function visibleTabs({ page, context }: PageInContext) {
  return (page.tabs ?? []).filter((tab) => tab.isHidden?.(context) !== true);
}

function navTabs({ page, context }: PageInContext) {
  return visibleTabs({ page, context }).filter((tab) => tab.hideInNav !== true);
}

function activeTabId({
  page,
  context,
  requested,
}: PageInContext & { requested: string | null }) {
  if (requested !== null) {
    return requested;
  }
  if (page.overview !== undefined) {
    return null;
  }
  return visibleTabs({ page, context })[0]?.id ?? null;
}

function isCrowned({
  page,
  context,
}: {
  page: AdminNavPage;
  context: AdminPageContext;
}) {
  if (page.nav.isLocked?.(context) === true) {
    return true;
  }
  const tabs = visibleTabs({ page, context });
  return (
    tabs.length > 0 && tabs.every((tab) => tab.isLocked?.(context) === true)
  );
}

function activePageId(pathname: string) {
  const matches = ADMIN_PAGES.filter(
    (page) => pathname === page.path || pathname.startsWith(page.path + '/'),
  );
  const best = matches.reduce<AdminPage | undefined>(
    (longest, page) =>
      longest === undefined || page.path.length > longest.path.length
        ? page
        : longest,
    undefined,
  );
  return best?.id;
}

export const adminPagesUtils = {
  visibleNavPages,
  visibleTabs,
  navTabs,
  activeTabId,
  isCrowned,
  activePageId,
};

export const ADMIN_PAGES: AdminPage[] = [
  {
    id: 'general',
    path: '/platform/setup/general',
    title: 'General',
    component: GeneralPage,
    nav: { label: 'General', icon: SettingsIcon },
  },
  {
    id: 'projects',
    path: '/platform/projects',
    title: 'Projects',
    component: ProjectsPage,
    nav: {
      label: 'Projects',
      icon: LayoutGridIcon,
    },
  },
  {
    id: 'users',
    path: '/platform/users',
    title: 'Users & access',
    overview: UsersOverview,
    nav: { label: 'Users & access', icon: UsersIcon },
    tabs: [
      { id: 'members', label: 'Members', component: UsersPage },
      {
        id: 'sso',
        label: 'Single sign on',
        component: SSOPage,
        isLocked: ({ plan }) => !plan.ssoEnabled,
        sample: true,
        teaser: {
          featureKey: 'SSO',
          title: 'Enable Single Sign On',
          description:
            'Let your users sign in with your current SSO provider or give them self serve sign up access',
          tier: 'team',
          bullets: [
            'Works with SAML and OIDC providers',
            'Enforce SSO for everyone on the platform',
            'Control who can self-serve sign up',
          ],
        },
      },
      {
        id: 'roles',
        label: 'Roles',
        component: ProjectRolePage,
        isLocked: ({ plan }) => !plan.projectRolesEnabled,
        sample: true,
        teaser: {
          featureKey: 'CUSTOM_ROLES',
          title: 'Project Role Management',
          description:
            'Define custom roles and permissions to control what your team members can access and modify',
          tier: 'team',
          bullets: [
            'Scope access per project, not per platform',
            'Keep production flows safe from accidental edits',
            'Assign roles when you invite someone',
          ],
        },
      },
    ],
  },
  {
    id: 'connections',
    path: '/platform/connections',
    title: 'Connections',
    overview: ConnectionsOverview,
    nav: { label: 'Connections', icon: UnplugIcon },
    tabs: [
      {
        id: 'project',
        label: 'Project connections',
        component: PlatformConnectionsPage,
      },
      {
        id: 'global',
        label: 'Global connections',
        component: GlobalConnectionsTable,
        isLocked: ({ plan }) => !plan.globalConnectionsEnabled,
        sample: true,
        teaser: {
          featureKey: 'GLOBAL_CONNECTIONS',
          title: 'Enable Global Connections',
          description: 'Manage platform-wide connections to external systems.',
          tier: 'team',
          bullets: [
            'Create once, use in any project',
            'Rotate credentials in a single place',
            'Choose which projects can use each connection',
          ],
        },
      },
    ],
  },
  {
    id: 'ai',
    path: '/platform/setup/ai',
    title: 'AI Center & MCP',
    overview: AiOverview,
    nav: { label: 'AI Center & MCP', icon: SparklesIcon },
    tabs: [
      { id: 'providers', label: 'Providers', component: ProvidersTab },
      {
        id: 'capabilities',
        label: 'Capabilities',
        component: CapabilitiesTab,
        isHidden: ({ edition }) => edition === ApEdition.COMMUNITY,
      },
      {
        id: 'mcp',
        label: 'MCP Server',
        component: PlatformMcpPage,
      },
    ],
  },
  {
    id: 'pieces',
    path: '/platform/setup/pieces',
    title: 'Pieces',
    nav: {
      label: 'Pieces',
      icon: PuzzleIcon,
    },
    tabs: [
      {
        id: 'pieces',
        label: 'Pieces',
        component: PiecesListTab,
        hideInNav: true,
      },
      {
        id: 'piece-sets',
        label: 'Piece Sets',
        component: PieceSetsTab,
        isLocked: ({ plan }) => !plan.managePiecesEnabled,
      },
    ],
  },
  {
    id: 'templates',
    sample: true,
    teaser: {
      featureKey: 'TEMPLATES',
      title: 'Unlock Templates',
      description:
        'Convert the most common automations into reusable templates 1 click away from your users',
      tier: 'enterprise',
    },
    path: '/platform/setup/templates',
    title: 'Templates',
    component: PlatformTemplatesPage,
    nav: {
      label: 'Templates',
      icon: LayoutGridIcon,
      isLocked: ({ plan }) => !plan.manageTemplatesEnabled,
    },
  },
  {
    id: 'embed',
    sample: true,
    teaser: {
      featureKey: 'SIGNING_KEYS',
      title: 'Unlock Embedding Through JS SDK',
      description: 'Enable signing keys to access embedding functionalities.',
      tier: 'enterprise',
    },
    path: '/platform/security/embed',
    title: 'Embedding',
    component: EmbedPage,
    nav: {
      label: 'Embedding',
      icon: FrameIcon,
      isLocked: ({ plan }) => !plan.embeddingEnabled,
    },
  },
  {
    id: 'security',
    path: '/platform/security',
    title: 'Security',
    overview: SecurityOverview,
    nav: {
      label: 'Security',
      icon: ShieldIcon,
    },
    tabs: [
      {
        id: 'api-keys',
        label: 'API keys',
        component: ApiKeysPage,
        isLocked: ({ plan }) => !plan.apiKeysEnabled,
        sample: true,
        teaser: {
          featureKey: 'API',
          title: 'Enable API Keys',
          description:
            'Create and manage API keys to access Activepieces APIs.',
          tier: 'team',
          bullets: [
            'Drive projects, flows and connections from your own tooling',
            'Scope a key to the platform, not to a person',
            'Revoke a key without touching anyone\u2019s login',
          ],
        },
      },
      {
        id: 'secrets',
        label: 'Secret managers',
        component: SecretManagersPage,
        isLocked: ({ plan }) => !plan.secretManagersEnabled,
        sample: true,
        teaser: {
          featureKey: 'SECRET_MANAGERS',
          title: 'Enable Secret Managers',
          description: 'Manage your secrets from a single and secure place',
          tier: 'enterprise',
          bullets: [
            'AWS, Azure, GCP and HashiCorp Vault',
            'Secrets never leave your infrastructure',
            'One secure place to rotate everything',
          ],
        },
      },
      {
        id: 'audit',
        label: 'Audit logs',
        component: AuditLogsPage,
        isLocked: ({ plan }) => !plan.auditLogEnabled,
        sample: true,
        teaser: {
          featureKey: 'AUDIT_LOGS',
          title: 'Unlock Audit Logs',
          description:
            'Comply with internal and external security policies by tracking activities done within your account',
          tier: 'enterprise',
          bullets: [
            'Every user and system action, recorded',
            'Filter by user, project and event type',
            'Export for compliance reviews',
          ],
        },
      },
      {
        id: 'events',
        label: 'Event streaming',
        component: EventDestinationsPage,
        isLocked: ({ plan }) => !plan.eventStreamingEnabled,
        sample: true,
        teaser: {
          featureKey: 'EVENT_DESTINATIONS',
          title: 'Unlock Event Streaming',
          description:
            'Forward every audit event we emit to a webhook, then handle it in a flow.',
          tier: 'enterprise',
          bullets: [
            'Stream events to any endpoint',
            'Wire alerts into Slack, PagerDuty or email',
            'Build your own monitoring on top',
          ],
        },
      },
    ],
  },
  {
    id: 'billing',
    sample: true,
    teaser: {
      featureKey: 'BILLING',
      showContactSales: false,
      title: 'Billing & usage',
      description:
        'Plans, credits and usage tracking are part of the Enterprise and Cloud editions.',
    },
    path: '/platform/setup/billing',
    title: 'Billing & usage',
    overview: BillingOverview,
    nav: {
      label: 'Billing & usage',
      icon: ReceiptIcon,
      isLocked: isCommunity,
    },
    tabs: [
      { id: 'plan', label: 'Plan', component: BillingPlanTab },
      { id: 'usage', label: 'Usage', component: BillingUsageTab },
    ],
  },
  {
    id: 'infrastructure',
    path: '/platform/infrastructure',
    title: 'Infrastructure',
    overview: InfrastructureOverview,
    nav: { label: 'Infrastructure', icon: ServerIcon },
    tabs: [
      { id: 'health', label: 'Health', component: SettingsHealthPage },
      { id: 'workers', label: 'Workers', component: SettingsWorkersPage },
      { id: 'triggers', label: 'Triggers', component: TriggerHealthPage },
      {
        id: 'configurations',
        label: 'Configurations',
        component: ConfigurationsPage,
        isHidden: ({ edition }) => edition === ApEdition.CLOUD,
      },
    ],
  },
  {
    id: 'piece-set-details',
    path: '/platform/setup/pieces/piece-sets/:id',
    title: 'Piece Set',
    component: PieceSetDetailsPage,
  },
  {
    id: 'billing-success',
    path: '/platform/setup/billing/success',
    title: 'Billing',
    component: Success,
  },
  {
    id: 'billing-error',
    path: '/platform/setup/billing/error',
    title: 'Billing',
    component: BillingError,
  },
];

export const ADMIN_REDIRECTS: AdminRedirect[] = [
  {
    from: '/platform',
    to: '/platform/projects',
    title: 'Platform',
    replace: false,
  },
  {
    from: '/platform/setup',
    to: '/platform/setup/ai',
    title: 'Platform Setup',
  },
  {
    from: '/platform/setup/ai-capabilities',
    to: '/platform/setup/ai?tab=capabilities',
  },
  {
    from: '/platform/setup/usage',
    to: '/platform/setup/billing?tab=usage',
  },
  {
    from: '/platform/setup/branding',
    to: '/platform/setup/general',
  },
  { from: '/platform/setup/mcp', to: '/platform/setup/ai?tab=mcp' },
  {
    from: '/platform/security/api-keys',
    to: '/platform/security?tab=api-keys',
  },
  { from: '/platform/security/sso', to: '/platform/users?tab=sso' },
  { from: '/platform/security/project-roles', to: '/platform/users?tab=roles' },
  {
    from: '/platform/setup/connections',
    to: '/platform/connections?tab=global',
  },
  {
    from: '/platform/security/secret-managers',
    to: '/platform/security?tab=secrets',
  },
  { from: '/platform/security/audit-logs', to: '/platform/security?tab=audit' },
  {
    from: '/platform/infrastructure/event-destinations',
    to: '/platform/security?tab=events',
  },
  {
    from: '/platform/infrastructure/workers',
    to: '/platform/infrastructure?tab=workers',
  },
  {
    from: '/platform/infrastructure/health',
    to: '/platform/infrastructure?tab=health',
  },
  {
    from: '/platform/infrastructure/triggers',
    to: '/platform/infrastructure?tab=triggers',
  },
  {
    from: '/platform/infrastructure/configurations',
    to: '/platform/infrastructure?tab=configurations',
  },
];

type PageInContext = {
  page: AdminPage;
  context: AdminPageContext;
};

export type AdminPageContext = {
  plan: PlatformWithoutSensitiveData['plan'];
  edition: ApEdition | null;
};

export type AdminPageNav = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  isLocked?: (context: AdminPageContext) => boolean;
  isHidden?: (context: AdminPageContext) => boolean;
};

export type AdminPageTabSpec = {
  id: string;
  label: string;
  component: ComponentType;
  isLocked?: (context: AdminPageContext) => boolean;
  isHidden?: (context: AdminPageContext) => boolean;
  hideInNav?: boolean;
  teaser?: FeatureTeaserProps;
  sample?: boolean;
};

export type AdminPage = {
  id: string;
  path: string;
  title: string;
  component?: ComponentType;
  overview?: ComponentType;
  tabs?: AdminPageTabSpec[];
  nav?: AdminPageNav;
  sample?: boolean;
  teaser?: FeatureTeaserProps;
};

export const VIEW_QUERY_PARAM = 'view';

export type AdminNavPage = AdminPage & { nav: AdminPageNav };

export type AdminRedirect = {
  from: string;
  to: string;
  title?: string;
  replace?: boolean;
};
