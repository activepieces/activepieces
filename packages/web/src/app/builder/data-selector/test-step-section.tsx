import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';

export const TestStepSection = ({ stepName }: { stepName: string }) => {
  const isTrigger = stepName === 'trigger';
  const selectStepByName = useBuilderStateContext(
    (state) => state.selectStepByName,
  );

  return (
    <div className="flex items-center justify-between gap-2 mx-3 my-2 px-3 py-2 rounded-md bg-gray-3/50 border border-dashed border-gray-6">
      <span className="text-sm text-gray-11 leading-snug">
        {isTrigger
          ? t('No sample data yet — load it from the trigger.')
          : t('No sample data yet — test this step first.')}
      </span>
      <Button
        onClick={() => selectStepByName(stepName)}
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-sm text-accent-11 hover:text-accent-11 hover:bg-accent-3 shrink-0"
      >
        {isTrigger ? t('Go to trigger') : t('Go to step')}
        <ArrowUpRight className="size-3" />
      </Button>
    </div>
  );
};
