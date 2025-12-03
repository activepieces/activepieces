import { t } from 'i18next';
import { AlertCircleIcon } from 'lucide-react';

import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';
import { isNil } from '@activepieces/shared';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';

import { useApErrorDialogStore } from './ap-error-dialog-store';

const ApErrorDialog = () => {
  const { params, closeDialog } = useApErrorDialogStore();

  if (isNil(params)) return null;

  return (
    <Dialog open={!!params} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <div className="flex flex-col items-center">
            <span
              className="rounded-full bg-red-100 flex items-center justify-center mb-2 mt-1"
              style={{ width: 48, height: 48 }}
            >
              <AlertCircleIcon className="h-8 w-8 text-red-500" />
            </span>
            <div className="flex flex-col items-center text-center w-full gap-2">
              <DialogTitle className="text-lg font-semibold">
                {params?.title}
              </DialogTitle>
              {params?.description && (
                <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                  {params.description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="w-full flex flex-col items-stretch mt-2">
          <CollapsibleJson
            json={params?.error}
            label={t('Technical Details')}
            defaultOpen={true}
            className="w-full text-left"
          />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={closeDialog}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ApErrorDialog.displayName = 'ApErrorDialog';
export { ApErrorDialog };
