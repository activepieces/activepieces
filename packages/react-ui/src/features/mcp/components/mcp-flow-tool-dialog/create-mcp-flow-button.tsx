import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { flowsHooks } from '@/features/flows/lib/flows-hooks';

export const CreateMcpFlowButton = () => {
  const { mutate: createMcpFlow, isPending } = flowsHooks.useCreateMcpFlow();

  return (
    <div
      onClick={() => createMcpFlow()}
      className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg border-dashed border-muted-foreground/50"
    >
      <Plus className="w-[40px] h-[40px] text-muted-foreground" />
      <div className="mt-2 text-center text-md">
        {isPending ? t('Creating...') : t('Create New Flow')}
      </div>
    </div>
  );
};
