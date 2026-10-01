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
    <div className="mx-4 my-2 flex items-center justify-between gap-2 rounded-xl border border-dashed border-gray-6 bg-gray-2 py-2 pr-2 pl-3">
      <span className="text-xs text-gray-11">
        {isTrigger
          ? t('No sample data yet — load it from the trigger.')
          : t('No sample data yet — test this step first.')}
      </span>
      <Button
        onClick={() => selectStepByName(stepName)}
        variant="ghost"
        size="xs"
        className="shrink-0 text-accent-11 hover:bg-accent-3 hover:text-accent-11"
      >
        {isTrigger ? t('Go to trigger') : t('Go to step')}
        <ArrowUpRight />
      </Button>
    </div>
  );
};
