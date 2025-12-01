import { t } from 'i18next';
import { JsonViewer } from '@/components/json-viewer';
import { isNil } from '@activepieces/shared';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '../../ui/dialog';

import { useApErrorDialogStore } from './ap-error-dialog-store';
import { DialogDescription } from '@radix-ui/react-dialog';

const ApErrorDialog = () => {
  const { error: dialogError, closeDialog } = useApErrorDialogStore();

  return (
    <Dialog open={!isNil(dialogError)} onOpenChange={closeDialog}>
      <DialogContent
        className="flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
           {t('Error')}
          </DialogTitle>
          <DialogDescription>
          {t('Error details, please copy and send it to support.')}
          </DialogDescription>
        </DialogHeader>
        <div className='overflow-y-scroll'>
          <JsonViewer json={dialogError} title={dialogError?.code ?? t('Error')} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

ApErrorDialog.displayName = 'ApErrorDialog';
export { ApErrorDialog };
