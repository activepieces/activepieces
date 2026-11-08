import { createContext, useContext } from 'react';
import { Link } from 'react-router-dom';

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
  const handlers = useContext(AppLinkContext);
  return (
    <Link
      to={route}
      onClick={(event) => {
        if (
          !handlers ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        handlers.open(route);
      }}
      className={cn(
        'rounded-sm text-accent-11 underline underline-offset-2 transition-colors hover:text-accent-11/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8',
        className,
      )}
    >
      {bare ? handlers?.label(route) ?? route.split(/[?#]/)[0] : children}
    </Link>
  );
}

const AppLinkContext = createContext<AppLinkHandlers | null>(null);

export type AppLinkHandlers = {
  open: (route: string) => void;
  label: (route: string) => string;
};
