import { t } from 'i18next';
import React, { ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PuzzleIcon } from '@/components/icons/puzzle';
import { WorkflowIcon } from '@/components/icons/workflow';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

const RunsLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const flowRunsPath = authenticationSession.appendProjectRoutePrefix('/runs');
  const pieceRunsPath =
    authenticationSession.appendProjectRoutePrefix('/piece-runs');

  const views: {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string; size?: number }>;
  }[] = [
    { to: flowRunsPath, label: t('Flow runs'), icon: WorkflowIcon },
    { to: pieceRunsPath, label: t('Action runs'), icon: PuzzleIcon },
  ];

  const activeView = location.pathname.includes(pieceRunsPath)
    ? pieceRunsPath
    : flowRunsPath;

  return (
    <div className="flex flex-col">
      <Tabs className={cn('pt-3 border-b', DASHBOARD_CONTENT_PADDING_X)}>
        <TabsList variant="outline">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <TabsTrigger
                key={view.to}
                value={view.to}
                variant="outline"
                className="pb-3"
                data-state={activeView === view.to ? 'active' : 'inactive'}
                onClick={() => navigate(view.to)}
              >
                <Icon size={16} className="mr-2" />
                {view.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
};

export { RunsLayout };
