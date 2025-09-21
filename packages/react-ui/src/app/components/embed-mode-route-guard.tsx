import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedMode } from '@/hooks/use-embed-mode';

interface EmbedModeRouteGuardProps {
  children: React.ReactNode;
}

const ALLOWED_EMBED_ROUTES = ['/flows', '/tables', '/connections'];

export const EmbedModeRouteGuard: React.FC<EmbedModeRouteGuardProps> = ({ children }) => {
  const { isEmbedMode } = useEmbedMode();
  const location = useLocation();

  // If not in embed mode, render children normally
  if (!isEmbedMode) {
    return <>{children}</>;
  }

  // In embed mode, check if current route is allowed
  const isAllowedRoute = ALLOWED_EMBED_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  // If route is not allowed, redirect to /flows
  if (!isAllowedRoute) {
    return <Navigate to="/flows" replace />;
  }

  return <>{children}</>;
};
