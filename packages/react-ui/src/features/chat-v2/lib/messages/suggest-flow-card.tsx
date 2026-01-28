import { t } from 'i18next';
import { Workflow, Lightbulb } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToolCallConversationMessage } from '@activepieces/shared';

interface SuggestFlowCardProps {
  message: ToolCallConversationMessage;
  className?: string;
}

export function SuggestFlowCard({ message, className }: SuggestFlowCardProps) {
  const isLoading = message.status === 'loading' || message.status === 'ready';
  const flowName = (message.input as { name?: string })?.name || t('Untitled Flow');

  const handleCreateFlow = () => {
    // TODO: Implement flow creation logic
    console.log('Create flow:', message.input);
  };

  if (isLoading) {
    return (
      <div className={cn('text-sm', className)}>
        <div className="flex items-center gap-2 py-1 animate-pulse">
          <Lightbulb className="size-4 shrink-0" />
          <span className="text-muted-foreground">
            {t('Suggesting a flow...')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-sm', className)}>
      <Card className="max-w-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Workflow className="size-4 text-primary" />
            </div>
            <span className="font-medium text-sm truncate">{flowName}</span>
          </div>
          <Button
            size="sm"
            onClick={handleCreateFlow}
          >
            {t('Create Flow')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
