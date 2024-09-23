import { t } from 'i18next';
import React from 'react';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import { formatUtils } from '@/lib/utils';

type TasksProgressProps = {
  tasks: {
    usage: number;
    plan: number;
  };
  aiTokens: {
    usage: number;
    plan: number;
  };
  nextBillingDate: string;
};

const TasksProgress: React.FC<TasksProgressProps> = ({
  aiTokens,
  tasks,
  nextBillingDate,
}) => {
  return (
    <div className="flex flex-col justify-center  gap-4">
      <div className="flex flex-row gap-3 items-center ">
        <ProgressCircularComponent
          data={{ plan: tasks.plan, usage: tasks.usage }}
        />
        <div className="flex flex-col gap-2">
          <span className="text-md">
            {t('{usage} of {plan} Tasks', {
              usage: tasks.usage,
              plan: tasks.plan,
            })}
          </span>
        </div>
      </div>
      <div className="flex  flex-row gap-3 items-center ">
        <ProgressCircularComponent
          data={{ plan: aiTokens.plan, usage: aiTokens.usage }}
        />
        <div className="flex flex-col gap-2">
          <span className="text-md">
            {t('{usage} of {plan} AI Credits', {
              usage: aiTokens.usage,
              plan: aiTokens.plan,
            })}
          </span>
        </div>
      </div>
      <span className="text-md text-muted-foreground">
        {t('Resets at')}{' '}
        {`${formatUtils.formatDate(new Date(nextBillingDate))}`}
      </span>
    </div>
  );
};

export { ProgressCircularComponent, TasksProgress };
