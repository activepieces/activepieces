import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { agentRunHooks } from './lib/agent-hooks';
import { Loader2, AlertTriangle } from 'lucide-react';
import { t } from 'i18next';

interface AgentRunDialogProps {
  agentRunId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgentRunDialog: React.FC<AgentRunDialogProps> = ({
  agentRunId,
  open,
  onOpenChange,
}) => {
  const { data: agentRun, isLoading, error } = agentRunHooks.useGet(agentRunId!);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>{t('Agent Run Details')}</DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="animate-spin w-8 h-8 mb-2" />
            <span>{t('Loading agent run...')}</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <span>{t('Failed to load agent run')}</span>
          </div>
        )}
        {agentRun && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground">
                {t('Status')}: <span className="font-medium">{agentRun.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t('Started')}: {agentRun.startTime ? new Date(agentRun.startTime).toLocaleString() : '-'}
              </div>
              {agentRun.finishTime && (
                <div className="text-xs text-muted-foreground">
                  {t('Finished')}: {new Date(agentRun.finishTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 