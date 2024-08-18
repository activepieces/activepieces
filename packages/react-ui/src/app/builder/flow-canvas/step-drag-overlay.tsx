import { t } from 'i18next';

import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { Action, Trigger } from '@activepieces/shared';

type StepDragTemplateProps = {
  step: Action | Trigger;
};

const StepDragOverlay = ({ step }: StepDragTemplateProps) => {
  const { stepMetadata } = piecesHooks.useStepMetadata({
    step: step!,
  });

  return (
    <div
      className={
        'p-4 h-[100px] opacity-75 w-[100px] flex items-center justify-center rounded-lg border border-solid border bg-white relative'
      }
    >
      <img
        id={t('logo')}
        className={'object-contain left-0 right-0 static'}
        src={stepMetadata?.logoUrl}
        alt={t('Step Icon')}
      />
    </div>
  );
};

export default StepDragOverlay;
