import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { SettingsShell } from './shell';

const GeneralSettingsPage = lazyWithRetry(
  () =>
    import('./general').then((m) => ({
      default: m.GeneralSettingsPage,
    })),
  'general-settings',
);

const VariablesPage = lazyWithRetry(
  () =>
    import('../variables').then((m) => ({
      default: m.VariablesPage,
    })),
  'variables-embed',
);

const WorkspaceSettingsPage = lazyWithRetry(
  () =>
    import('./workspace').then((m) => ({
      default: m.WorkspaceSettingsPage,
    })),
  'workspace-settings',
);

const AccountSettingsPage = lazyWithRetry(
  () =>
    import('./account').then((m) => ({
      default: m.AccountSettingsPage,
    })),
  'account-settings',
);

const SecuritySettingsPage = lazyWithRetry(
  () =>
    import('./security').then((m) => ({
      default: m.SecuritySettingsPage,
    })),
  'security-settings',
);

export function SettingsPage() {
  return (
    <SettingsShell>
      {(section) => {
        switch (section) {
          case 'general':
            return <WorkspaceSettingsPage />;
          case 'variables':
            return <VariablesPage />;
          case 'workspace':
            return <WorkspaceSettingsPage />;
          case 'account':
            return <AccountSettingsPage />;
          case 'security':
            return <SecuritySettingsPage />;
          default:
            return null;
        }
      }}
    </SettingsShell>
  );
}
