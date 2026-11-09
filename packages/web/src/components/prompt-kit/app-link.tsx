import { createContext, useContext } from 'react';
import { Link } from 'react-router-dom';

import { domUtils } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

export function AppLinkProvider({
  value,
  children,
}: {
  value: AppLinkHandlers;
  children: React.ReactNode;
}) {
  return (
    <AppLinkContext.Provider value={value}>{children}</AppLinkContext.Provider>
  );
}

export function useAppLinks(): AppLinkHandlers | null {
  return useContext(AppLinkContext);
}

export function AppLink({
  route,
  bare,
  className,
  children,
}: {
  route: string;
  bare: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const handlers = useAppLinks();
  return (
    <Link
      to={route}
      onClick={(event) => {
        if (!handlers || !domUtils.isPlainLeftClick(event)) return;
        const opened = handlers.open({
          route,
          name: event.currentTarget.textContent?.trim() || route,
        });
        if (opened) event.preventDefault();
      }}
      className={cn(
        'rounded-sm text-accent-11 underline underline-offset-2 transition-colors duration-(--dur-micro) ease-[ease] hover:text-accent-11/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8',
        className,
      )}
    >
      {bare ? handlers?.label(route) ?? route.split(/[?#]/)[0] : children}
    </Link>
  );
}

const AppLinkContext = createContext<AppLinkHandlers | null>(null);

export type AppLinkHandlers = {
  open: (params: { route: string; name: string }) => boolean;
  label: (route: string) => string;
};
