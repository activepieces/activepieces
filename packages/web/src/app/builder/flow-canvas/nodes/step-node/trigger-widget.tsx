import { t } from 'i18next';
import { Goal } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { cn } from '@/lib/utils';

const TriggerWidget = ({ isSelected }: { isSelected: boolean }) => {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );

  if (canvasOrientation === 'horizontal') {
    return (
      <div
        className={cn(
          'absolute right-full top-1/2 -translate-y-1/2 mr-2 flex size-7 items-center justify-center rounded-full border border-gray-6 bg-gray-1 text-gray-11 z-10 transition-all',
          {
            'border-accent-9 text-accent-11': isSelected,
            'group-hover:border-gray-8': !isSelected,
          },
        )}
      >
        <Goal className="size-3.5"></Goal>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center absolute transition-all  -translate-y-[26px] -translate-x-[1px]  border-gray-6 border border-1   justify-center gap-1 rounded-t-md bg-gray-1 text-gray-11 text-xs py-1 px-2 z-10 ',
        {
          'border-accent-9 text-accent-11 ': isSelected,
          'group-hover:border-gray-8 ': !isSelected,
        },
      )}
    >
      <Goal className="w-[10px] h-[10px]"></Goal> {t('Trigger')}
    </div>
  );
};

export { TriggerWidget };
