import { ManagePlanDialog } from '@/features/billing/components/manage-plan-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

type UpgradeHookDialogProps = {
  metric: 'activeFlows' | 'mcp' | 'tables' | 'agents';
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function UpgradeHookDialog({
  metric,
  open,
  setOpen,
}: UpgradeHookDialogProps) {
  const { data: edition } = flagsHooks.useFlag(ApFlagId.EDITION);

  if (edition !== ApEdition.CLOUD) {
    return null;
  }

  return <ManagePlanDialog metric={metric} open={open} setOpen={setOpen} />;
}
