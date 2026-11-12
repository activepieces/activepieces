import { t } from 'i18next';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';

import { ConfirmPurchaseDialog } from './confirm-purchase-dialog';
import { PlanSelector } from './plan-selector';
import { PlanSwitchSuccessDialog } from './plan-switch-success-dialog';

export function ManagePlanDialog() {
  const { isOpen, closeDialog } = billingDialogHooks.useManagePlanDialogStore();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-[1100px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Explore plans')}</DialogTitle>
          </DialogHeader>
          <PlanSelector enabled={isOpen} onSelected={closeDialog} />
        </DialogContent>
      </Dialog>
      <ConfirmPurchaseDialog />
      <PlanSwitchSuccessDialog />
    </>
  );
}
