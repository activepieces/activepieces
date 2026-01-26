import { t } from 'i18next';
import { Workflow } from 'lucide-react';

import { useChatSessionStore } from '@/features/chat-v2/store';
import { agentStateKeys } from '@activepieces/shared';

type SimpleFlow = {
  id: string;
  displayName: string;
  description: string;
  trigger: {
    pieceName: string;
    triggerName: string;
    description?: string;
  };
  prompt: string;
  tools: {
    pieceName: string;
    actionName: string;
    description?: string;
  }[];
};

export function QuickFlowsList() {
  const { session } = useChatSessionStore();

  const flows: SimpleFlow[] =
    (session?.state?.[agentStateKeys.FLOWS] as { flows: SimpleFlow[] } | undefined)?.flows ?? [];

  return (
    <div className="pr-4">
      <div className="flex items-center gap-2 mb-3">
        <Workflow className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t('Flows')}</span>
      </div>
      {flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed rounded-lg bg-muted/30">
          <Workflow className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {t('No flows yet')}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {t('Flows created by Quick will appear here')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {flows.map((flow) => (
            <li
              key={flow.id}
              className="p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="font-medium text-sm">{flow.displayName}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {flow.description}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
