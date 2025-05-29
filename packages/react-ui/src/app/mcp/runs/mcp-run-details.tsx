import { t } from 'i18next';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { StepMetadataWithSuggestions } from '@/features/pieces/lib/types';
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
            {selectedItem.status === McpRunStatus.SUCCESS ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-xs font-medium">{t('Success')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-medium">{t('Failed')}</span>
              </div>
            )}
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
