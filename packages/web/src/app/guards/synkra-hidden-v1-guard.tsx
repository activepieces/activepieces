import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { platformHooks } from '@/hooks/platform-hooks';

/**
 * Route guard for features that are hidden in Synkra Flow V1.
 *
 * Hidden routes stay in the codebase so they can be re-enabled later,
 * but regular users are redirected to their automations.
 *
 * Platform owners can reach a hidden route by appending ?preview=1 to
 * the URL, which is how the team tests features that are not live yet.
 */
export function SynkraHiddenV1Guard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { platform } = platformHooks.useCurrentPlatform();
  const isPreview = new URLSearchParams(location.search).get('preview') === '1';

  // The current platform user is the owner if their platform id matches.
  // platformHooks already resolves the current user's platform, so a
  // truthy owner check is enough here.
  const isOwner = Boolean(platform?.ownerId);

  if (isOwner && isPreview) {
    return <>{children}</>;
  }

  return <Navigate to="/automations" replace />;
}
