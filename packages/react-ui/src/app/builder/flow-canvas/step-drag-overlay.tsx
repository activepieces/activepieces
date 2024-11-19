import { t } from 'i18next';
import { useEffect, useRef } from 'react';

import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { Action, Trigger } from '@activepieces/shared';

const StepDragOverlay = ({
  step,
  lefSideBarContainerWidth,
}: {
  step: Action | Trigger;
  lefSideBarContainerWidth: number;
}) => {
  const shadowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (shadowRef.current) {
        shadowRef.current.style.left = `${
          event.clientX - 50 - lefSideBarContainerWidth
        }px`;
        shadowRef.current.style.top = `${event.clientY - 125}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const { stepMetadata } = piecesHooks.useStepMetadata({
    step,
  });

  return (
    <div
      className={
        'p-4 absolute left-0 top-0 h-[100px] opacity-75 w-[100px] flex items-center justify-center rounded-lg border border-solid border bg-white'
      }
      ref={shadowRef}
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
