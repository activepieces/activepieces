import { Book } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { FlowOperationType } from '@activepieces/shared';

const FlowContextWidget = () => {
  const { flowVersion, applyOperation } = useBuilderStateContext((state) => ({
    flowVersion: state.flowVersion,
    applyOperation: state.applyOperation,
  }));
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(flowVersion.flowContext ?? '');
  const [debouncedContext] = useDebounce(context, 1200);

  const handleSave = async () => {
    applyOperation({
      type: FlowOperationType.UPDATE_FLOW_CONTEXT,
      request: {
        flowContext: debouncedContext,
      },
    });
  };

  useEffect(() => {
    handleSave();
  }, [debouncedContext]);

  return (
    <div className="absolute top-0 right-[10px]">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 px-3"
          >
            <Book className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          className="w-[400px] p-4"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Add Flow Context</h3>
              <p className="text-xs text-muted-foreground">
                Describe what this flow is expected to do and any important
                context for LLM to fill the properties.
              </p>
            </div>

            <Textarea
              placeholder="E.g., This flow monitors customer support tickets and automatically assigns them to team members based on ticket category and priority level. It also sends notifications to managers for high-priority issues."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[100px] resize-none text-sm"
              autoFocus
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export { FlowContextWidget };
