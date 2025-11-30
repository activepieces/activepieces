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

const ApErrorDialog = () => {
  const { error: dialogError, closeDialog } = useApErrorDialogStore();

  return (
    <Dialog open={!isNil(dialogError)} onOpenChange={closeDialog}>
      <DialogContent
        className="max-h-[80vh] overflow-y-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            {t('Error details, please copy and send it to support.')}
          </DialogTitle>
        </DialogHeader>
        <JsonViewer json={dialogError} title="error.json" />
      </DialogContent>
    </Dialog>
  );
};

ApErrorDialog.displayName = 'ApErrorDialog';
export { ApErrorDialog };
