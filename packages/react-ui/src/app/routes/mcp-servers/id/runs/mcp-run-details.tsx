import { t } from 'i18next';
import { X, Check } from 'lucide-react';

import { JsonViewer } from '@/components/json-viewer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { StepMetadataWithSuggestions } from '@/lib/types';
import { formatUtils } from '@/lib/utils';
import { McpRun, McpRunStatus } from '@activepieces/shared';

import { mcpRunUtils } from './mcp-run-utils';

type McpRunDetailsProps = {
  selectedItem: McpRun;
  metadata: StepMetadataWithSuggestions[];
  setSelectedItem: (item: McpRun | null) => void;
};

const McpRunDetails = ({
  selectedItem,
  metadata,
  setSelectedItem,
}: McpRunDetailsProps) => {
  return (
    <Sheet open={true} onOpenChange={() => setSelectedItem(null)}>
      <SheetContent
        className="w-[600px] sm:w-[700px] sm:max-w-none"
        hideCloseButton={true}
      >
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {mcpRunUtils.getToolIcon(selectedItem, metadata)}
              {mcpRunUtils.getActionName(selectedItem)}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{mcpRunUtils.getToolDisplayName(selectedItem)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mcpRunUtils.getTooltipContent(selectedItem)}</p>
              </TooltipContent>
            </Tooltip>
            <span>•</span>
            <span>
              {formatUtils.formatDate(new Date(selectedItem.created))}
            </span>
            <span>•</span>
            <div className="text-left">
              <StatusIconWithText
                icon={selectedItem.status === McpRunStatus.SUCCESS ? Check : X}
                text={formatUtils.convertEnumToHumanReadable(
                  selectedItem.status,
                )}
                variant={
                  selectedItem.status === McpRunStatus.SUCCESS
                    ? 'success'
                    : 'error'
                }
              />
            </div>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6">
            <JsonViewer json={selectedItem.input} title={t('Input')} />
            <JsonViewer json={selectedItem.output} title={t('Output')} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default McpRunDetails;
