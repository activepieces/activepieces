import { t } from 'i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { PlanSelector } from './plan-selector';

export function ManagePlanDialog() {
  const { isOpen, closeDialog } = useManagePlanDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('Manage Plan')}</DialogTitle>
          <DialogDescription>
            {t('Choose the plan that fits your team.')}
          </DialogDescription>
        </DialogHeader>
        <PlanSelector enabled={isOpen} onSelected={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
