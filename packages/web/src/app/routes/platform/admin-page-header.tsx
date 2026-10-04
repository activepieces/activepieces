import { t } from 'i18next';
import * as React from 'react';

import { PageHeader } from '@/components/custom/page';

export function AdminPageHeader({
  page,
  badge,
  children,
}: {
  page: AdminPage;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { title, description } = ADMIN_PAGES[page]();
  return (
    <PageHeader title={title} description={description} badge={badge}>
      {children}
    </PageHeader>
  );
}

const ADMIN_PAGES: Record<
  AdminPage,
  () => { title: string; description: string }
> = {
  users: () => ({
    title: t('Users'),
    description: t(
      'Everyone with an account on the platform, and everyone invited to make one.',
    ),
  }),
  roles: () => ({
    title: t('Roles'),
    description: t(
      'What each role may do inside a project. Custom roles are for when a built-in one does not fit.',
    ),
  }),
  pieces: () => ({
    title: t('Pieces'),
    description: t(
      'Every piece builders can add to a flow. Pin favourites and bring your own OAuth apps.',
    ),
  }),
  pieceSets: () => ({
    title: t('Piece sets'),
    description: t(
      'A set is the list of pieces a project may build with. Projects use the default set unless you assign another.',
    ),
  }),
  auditLog: () => ({
    title: t('Audit log'),
    description: t(
      'Every meaningful action on the platform: who did it, when, from where, and what it touched.',
    ),
  }),
  eventStreaming: () => ({
    title: t('Event streaming'),
    description: t(
      'Each chosen audit event is posted to a URL you own, or handed to a flow on this platform.',
    ),
  }),
  mcpTools: () => ({
    title: t('MCP tools'),
    description: t(
      'Which tools AI clients may use in every project and in AI Chat. Clients act with the signed-in user’s permissions.',
    ),
  }),
  mcpActivity: () => ({
    title: t('MCP activity'),
    description: t(
      'Piece actions run by AI clients like Claude and Cursor. Other tool calls are not logged.',
    ),
  }),
  workers: () => ({
    title: t('Workers'),
    description: t('The machines that run your flows, and how busy they are.'),
  }),
  workerGroups: () => ({
    title: t('Worker groups'),
    description: t(
      'Give important projects their own machines, and set how many of their runs go at once.',
    ),
  }),
  systemHealth: () => ({
    title: t('System health'),
    description: t(
      'Whether the platform is set up well, and how stable it has been.',
    ),
  }),
  runsHealth: () => ({
    title: t('Runs health'),
    description: t('How reliably runs finished over a month.'),
  }),
  queueHealth: () => ({
    title: t('Queue health'),
    description: t('Whether jobs are piling up right now.'),
  }),
  triggerHealth: () => ({
    title: t('Trigger health'),
    description: t(
      'How often each piece’s trigger checks succeeded over the last 14 days.',
    ),
  }),
  billing: () => ({
    title: t('Billing'),
    description: t(
      'Your plan, credits and seats. For billing questions, write to support@activepieces.com.',
    ),
  }),
  usage: () => ({
    title: t('Usage'),
    description: t(
      'What this platform has used of its plan, and which projects spent the credits.',
    ),
  }),
};

export type AdminPage =
  | 'users'
  | 'roles'
  | 'pieces'
  | 'pieceSets'
  | 'auditLog'
  | 'eventStreaming'
  | 'mcpTools'
  | 'mcpActivity'
  | 'workers'
  | 'workerGroups'
  | 'systemHealth'
  | 'runsHealth'
  | 'queueHealth'
  | 'triggerHealth'
  | 'billing'
  | 'usage';
