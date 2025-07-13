import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { Bot, Settings, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Agent } from '@activepieces/shared';
import { agentHooks } from '@/features/agents/lib/agent-hooks';

interface ManageAgentDialogProps {
  children: React.ReactNode;
}

export function ManageAgentDialog({
  children,
}: ManageAgentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: agents } = agentHooks.useList();
  const tableAgents = agents;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" withCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {t('Manage Agents')}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('Close')}</span>
            </Button>
          </div>
        </DialogHeader>

        {tableAgents && tableAgents.data && (
          <div className="space-y-6">
            <div>
              {tableAgents.data.length === 0 ? (
                <div className="text-center  text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">{t('No agents configured yet')}</p>
                  <p className="text-xs mt-1">{t('Create your first agent to get started')}</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {tableAgents.data.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{agent.displayName}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {t('Row Created')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { }}
                          className="h-8 w-8 p-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setIsOpen(false)}
              >
                {t('Close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 