import { t } from 'i18next';
import * as React from 'react';

import { PageHeader } from '@/components/custom/page';

export function AdminPageHeader({
  page,
  badge,
  description,
  children,
}: {
  page: AdminPage;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const copy = ADMIN_PAGES[page]();
  return (
    <PageHeader
      title={copy.title}
      description={description ?? copy.description}
      badge={badge}
    >
      {children}
    </PageHeader>
  );
}

export function adminPageTitle(page: AdminPage): string {
  return ADMIN_PAGES[page]().title;
}

const ADMIN_PAGES: Record<
  AdminPage,
  () => { title: string; description: string }
> = {
  projects: () => ({
    title: t('Projects'),
    description: t(
      'Every project on the platform, with its flows, connections and members.',
    ),
  }),
  users: () => ({
    title: t('Users'),
    description: t(
      'Everyone with an account on the platform, and everyone invited to make one.',
    ),
  }),
  roles: () => ({
    title: t('Roles'),
    description: t(
      'What each role may do inside a project. Make your own when a built-in role does not fit.',
    ),
  }),
  pieces: () => ({
    title: t('Pieces'),
    description: t(
      'Every piece builders can add to a flow. Install your own and bring your own OAuth apps.',
    ),
  }),
  piecePolicies: () => ({
    title: t('Piece policies'),
    description: t(
      'Which pieces each project can build with, and which actions its flows must use.',
    ),
  }),
  addStepMenu: () => ({
    title: t('Add step menu'),
    description: t(
      'The tabs and pieces builders see when they add a step to a flow.',
    ),
  }),
  templates: () => ({
    title: t('Templates'),
    description: t('Ready-made flows everyone on the platform can start from.'),
  }),
  connections: () => ({
    title: t('Connections'),
    description: t(
      'Every connection on the platform, and the global ones you share with projects.',
    ),
  }),
  aiProviders: () => ({
    title: t('AI providers'),
    description: t(
      'The AI providers your company pays for, and what the built-in assistant can do with them.',
    ),
  }),
  sso: () => ({
    title: t('Single sign-on'),
    description: t('How people sign in, and which email domains may join.'),
  }),
  secretManagers: () => ({
    title: t('Secret managers'),
    description: t(
      'Vaults that hold credentials, so connections point to a secret instead of storing it.',
    ),
  }),
  apiKeys: () => ({
    title: t('API keys'),
    description: t('Keys your own code uses to call the platform API.'),
  }),
  auditLog: () => ({
    title: t('Audit log'),
    description: t(
      'Every meaningful action on the platform: who did it, when, from where and what it touched.',
    ),
  }),
  eventStreaming: () => ({
    title: t('Event streaming'),
    description: t(
      'Send audit events as they happen to a URL you own or to a flow.',
    ),
  }),
  embedSdk: () => ({
    title: t('Embed SDK'),
    description: t(
      'Put flows, connections and the builder inside your own product.',
    ),
  }),
  mcpTools: () => ({
    title: t('MCP tools'),
    description: t(
      "What AI clients may do in every project. They act with the signed-in person's permissions.",
    ),
  }),
  mcpActivity: () => ({
    title: t('MCP activity'),
    description: t(
      'Piece actions AI clients ran in every project, and whether they worked.',
    ),
  }),
  workers: () => ({
    title: t('Worker machines'),
    description: t('The machines that run your flows, and how busy they are.'),
  }),
  workerGroups: () => ({
    title: t('Worker groups'),
    description: t(
      'Give important projects their own machines and limit how many of their runs go at once.',
    ),
  }),
  systemHealth: () => ({
    title: t('System health'),
    description: t(
      'Whether the platform is set up well and how stable it has been.',
    ),
  }),
  runsHealth: () => ({
    title: t('Run health'),
    description: t('How reliably runs finished, month by month.'),
  }),
  queueHealth: () => ({
    title: t('Queue health'),
    description: t('Whether work is piling up right now.'),
  }),
  triggerHealth: () => ({
    title: t('Trigger health'),
    description: t("How often each piece's trigger checks succeed."),
  }),
  general: () => ({
    title: t('General'),
    description: t(
      "Your platform's name, branding and defaults for new projects.",
    ),
  }),
  billing: () => ({
    title: t('Plan'),
    description: t('Your plan, credits, seats and licence key.'),
  }),
  usage: () => ({
    title: t('Usage'),
    description: t(
      'What the platform used this period, and which projects used it.',
    ),
  }),
};

export type AdminPage =
  | 'projects'
  | 'users'
  | 'roles'
  | 'pieces'
  | 'piecePolicies'
  | 'addStepMenu'
  | 'templates'
  | 'connections'
  | 'aiProviders'
  | 'sso'
  | 'secretManagers'
  | 'apiKeys'
  | 'auditLog'
  | 'eventStreaming'
  | 'embedSdk'
  | 'mcpTools'
  | 'mcpActivity'
  | 'workers'
  | 'workerGroups'
  | 'systemHealth'
  | 'runsHealth'
  | 'queueHealth'
  | 'triggerHealth'
  | 'general'
  | 'billing'
  | 'usage';
