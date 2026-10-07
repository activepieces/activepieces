import { Navigate, useLocation } from 'react-router-dom';

export function LegacyPathRedirect() {
  const { pathname, search, hash } = useLocation();

  return (
    <Navigate to={{ pathname: resolve(pathname), search, hash }} replace />
  );
}

function resolve(pathname: string): string {
  const match = LEGACY_PATHS.find(
    ({ from }) => pathname === from || pathname.startsWith(`${from}/`),
  );
  if (match === undefined) {
    return '/platform';
  }
  if (match.catchAll === true) {
    return match.to;
  }
  return `${match.to}${pathname.slice(match.from.length)}`;
}

const LEGACY_PATHS: LegacyPath[] = [
  { from: '/platform/setup/ai-capabilities', to: '/platform/ai/capabilities' },
  { from: '/platform/setup/general', to: '/platform/general' },
  { from: '/platform/setup/branding', to: '/platform/general' },
  { from: '/platform/setup/ai', to: '/platform/ai' },
  { from: '/platform/setup/mcp', to: '/platform/mcp' },
  { from: '/platform/setup/connections', to: '/platform/connections/global' },
  { from: '/platform/setup/pieces', to: '/platform/pieces' },
  { from: '/platform/setup/templates', to: '/platform/templates' },
  { from: '/platform/setup/billing', to: '/platform/billing' },
  { from: '/platform/setup/usage', to: '/platform/usage' },
  { from: '/platform/security/api-keys', to: '/platform/api-keys' },
  {
    from: '/platform/security/secret-managers',
    to: '/platform/secret-managers',
  },
  { from: '/platform/security/audit-logs', to: '/platform/audit-log' },
  { from: '/platform/security/embed', to: '/platform/embedding' },
  { from: '/platform/security/sso', to: '/platform/sso' },
  { from: '/platform/security/project-roles', to: '/platform/users/roles' },
  {
    from: '/platform/infrastructure/event-destinations',
    to: '/platform/audit-log/streaming',
  },
  { from: '/platform/infrastructure/workers', to: '/platform/workers' },
  { from: '/platform/infrastructure/health', to: '/platform/health' },
  { from: '/platform/infrastructure/triggers', to: '/platform/triggers' },
  {
    from: '/platform/infrastructure/configurations',
    to: '/platform/configurations',
  },
  { from: '/platform/setup', to: '/platform/ai', catchAll: true },
  { from: '/platform/security', to: '/platform/audit-log', catchAll: true },
  { from: '/platform/infrastructure', to: '/platform/workers', catchAll: true },
];

export const legacyPathUtils = { resolve };

type LegacyPath = {
  from: string;
  to: string;
  catchAll?: boolean;
};
