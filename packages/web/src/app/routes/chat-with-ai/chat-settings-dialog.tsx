import { t } from 'i18next';
import { Plug } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ChatSettingsDialog({ open, onClose }: ChatSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] rounded-sm flex flex-col p-0">
        <div className="flex h-[700px]">
          <div className="w-[238px] border-r">
            <nav className="bg-sidebar space-y-1 bg-muted rounded-sm rounded-r-none h-full flex flex-col rounded-l-md">
              <div className="px-3 my-4">
                <span className="text-sm font-semibold">
                  {t('AI Chat Settings')}
                </span>
              </div>
              <div className="flex flex-col px-2 gap-1">
                <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium transition-all cursor-pointer bg-sidebar-accent">
                  <Plug className="w-4 h-4" />
                  {t('Connectors')}
                </div>
              </div>
            </nav>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-3 px-8 pt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{t('Connectors')}</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      {t('Manage your connected services and data sources.')}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </div>
            <div className="border-t bg-background rounded-br-md">
              <div className="flex items-center justify-end gap-3 px-6 py-4">
                <Button variant="outline" size="sm" onClick={onClose}>
                  {t('Close')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
