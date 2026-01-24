import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows/lib/flow-hooks';

export const CreateMcpFlowButton = () => {
  const { mutate: createMcpFlow, isPending } = flowHooks.useCreateMcpFlow();

  return (
    <Button
      onClick={() => createMcpFlow()}
      variant="outline"
      className="mr-auto"
    >
      {isPending ? t('Creating...') : t('New MCP Flow')}
    </Button>
  );
};
