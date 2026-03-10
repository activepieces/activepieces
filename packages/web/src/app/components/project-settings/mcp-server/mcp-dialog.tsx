import { t } from 'i18next';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { McpServerSettings } from '.';

interface McpServerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function McpServerDialog({ open, onClose }: McpServerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] pb-4 flex flex-col px-5">
        <DialogHeader>
          <DialogTitle className="font-semibold">{t('MCP')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1" viewPortClassName="px-1">
          <McpServerSettings />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
