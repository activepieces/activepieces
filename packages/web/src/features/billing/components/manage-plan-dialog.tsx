import { t } from 'i18next';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { PlanSelector } from './plan-selector';

export function ManagePlanDialog() {
  const { isOpen, closeDialog } = useManagePlanDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-[1100px]">
        <DialogHeader>
          <DialogTitle>{t('Explore plans')}</DialogTitle>
        </DialogHeader>
        <PlanSelector enabled={isOpen} onSelected={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
