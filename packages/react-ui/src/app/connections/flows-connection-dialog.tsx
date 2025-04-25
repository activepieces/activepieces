import { DialogTrigger } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import {
  AppConnectionWithoutSensitiveData,
  PopulatedFlow,
} from '@activepieces/shared';
import { cn } from '@/lib/utils';

type FlowsDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
};

const FlowsDialog = React.memo(({ connection }: FlowsDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [flows, setFlows] = useState<Array<PopulatedFlow>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadFlows = async () => {
    try {
      setIsLoading(true);
      const affectedFlows = await appConnectionsApi.flows(connection.id);
      setFlows(affectedFlows);
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('Failed to get flows'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDialogOpen(true);
                  loadFlows();
                }}
              >
                <Workflow className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Show flows')}</p>
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('Flows Using This Connection')}</DialogTitle>
            <DialogDescription>
              {t('List of flows that are using the connection:')}{' '}
              <span className="font-bold text-black">
                {connection.displayName}
              </span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className={cn("h-[275px]", (isLoading || flows.length === 0 ) && "h-[80px]")}>
            {isLoading ? (
              <div className="flex justify-center items-center w-full h-[80px]">
                <LoadingSpinner className="h-6 w-6 justify-center items-center" />
              </div>
            ) : flows.length === 0 ? (
              <div className="flex justify-center items-center h-[80px]">
                {t('No flows are using this connection')}
              </div>
            ) : (
              <ul className="list-disc pl-6 gap-2">
                {flows.map((flow, index) => (
                  <li key={index}>{flow.version.displayName}</li>
                ))}
              </ul>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button type="button" onClick={() => setDialogOpen(false)}>
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
});

FlowsDialog.displayName = 'FlowsDialog';
export { FlowsDialog };
