import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { ShowPoweredBy } from '../../../components/show-powered-by';

type SidebarProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  isHomeDashboard?: boolean;
  hideSideNav?: boolean;
};

export function SidebarComponent({
  children,
  sidebar,
  isHomeDashboard = false,
  hideSideNav = false,
}: SidebarProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex h-screen w-full">
        {!hideSideNav && (
          <>
            {sidebar}
          </>
        )}
        <div
          className={cn('bg-sidebar w-full h-full overflow-hidden', {
            'pt-2 pr-2 pb-2': !hideSideNav,
          })}
        >
          <ScrollArea
            className={cn('w-full pb-6 pt-28 px-6 h-full bg-background', {
              'rounded-lg border-b-0 border': !hideSideNav,
            })}
            style={{
              boxShadow: hideSideNav
                ? '0 2px 2px #0000000a,0 8px 8px -8px #0000000a'
                : 'none',
            }}
          >
            {children}
          </ScrollArea>
        </div>
      </div>
      <ShowPoweredBy
        show={isHomeDashboard}
        position="absolute"
      />
    </div>
  );
}
