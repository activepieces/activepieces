import { DialogDescription } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { AlertCircleIcon } from 'lucide-react';

import { JsonViewer } from '@/components/json-viewer';
import { Button } from '@/components/ui/button';
import {
  ExecutionError,
  ErrorCode,
  getApErrorParams,
  getExecutionError,
  ExecutionErrorType,
  isNil,
} from '@activepieces/shared';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '../../ui/dialog';

import { useApErrorDialogStore } from './ap-error-dialog-store';

const ApErrorDialog = () => {
  const { params, closeDialog } = useApErrorDialogStore();

  const getExecutionUserError = (error: unknown): ExecutionError | null => {
    if (isNil(error)) return null;
    const apError = getApErrorParams(error, ErrorCode.TRIGGER_UPDATE_STATUS);
    if (!apError) return null;
    const executionError = getExecutionError(apError.standardError);
    if (!executionError) return null;
    if (executionError.type !== ExecutionErrorType.USER) return null;
    return executionError;
  };

  const executionUserError = getExecutionUserError(params?.error);

  return (
    <Dialog open={!isNil(params)} onOpenChange={closeDialog}>
      <DialogContent
        className="flex flex-col max-h-[45vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{params?.title}</DialogTitle>
          <DialogDescription>{params?.description}</DialogDescription>
        </DialogHeader>
        {executionUserError ? (
          <div className="flex items-start gap-2 text-destructive-300 border-destructive-300 border rounded-md p-4">
            <AlertCircleIcon className="w-4 h-4 mt-1" />
            <div className="flex flex-col gap-1">
              <p className="font-medium">{executionUserError.name}</p>
              <p>{executionUserError.message}</p>
            </div>
          </div>
        ) : (
          <JsonViewer
            className="max-h-56 overflow-y-scroll"
            json={params?.error}
            title={t('Issue details')}
          />
        )}
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
