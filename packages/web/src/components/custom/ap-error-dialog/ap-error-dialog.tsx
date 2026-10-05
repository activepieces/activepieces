import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { AlertCircleIcon } from 'lucide-react';

import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';

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
            <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-danger-3">
              <AlertCircleIcon className="size-6 text-danger-11" />
            </span>
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <DialogTitle>{params?.title}</DialogTitle>
              {params?.description && (
                <DialogDescription>{params.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex max-h-[60vh] w-full flex-col items-stretch overflow-y-auto">
          <CollapsibleJson
            json={params?.error}
            label={t('Technical Details')}
            defaultOpen={params.technicalDetailsDefaultOpen ?? false}
            className="w-full text-left"
          />
        </div>
        <DialogFooter>
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
