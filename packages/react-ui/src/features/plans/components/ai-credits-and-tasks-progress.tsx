import { t } from 'i18next';
import React from 'react';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import { formatUtils } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

type AiCreditsAndTasksProgressProps = {
  tasks: {
    usage: number;
    plan: number | undefined | null;
  };
  aiTokens: {
    usage: number;
    plan: number | undefined | null;
  };
  nextBillingDate: string;
};

const AiCreditsAndTasksProgress: React.FC<AiCreditsAndTasksProgressProps> = ({
  aiTokens,
  tasks,
  nextBillingDate,
}) => {
  return (
    <div className="flex flex-col justify-center  gap-4">
      <div className="flex flex-row gap-3 items-center ">
        {!isNil(tasks.plan) && (
          <ProgressCircularComponent
            data={{ plan: tasks.plan, usage: tasks.usage }}
          />
        )}
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
        {!isNil(aiTokens.plan) && (
          <ProgressCircularComponent
            data={{ plan: aiTokens.plan, usage: aiTokens.usage }}
          />
        )}
        <div className="flex flex-col gap-2">
          <span className="text-md">
            {t('{usage} of {plan}', {
              usage: aiTokens.usage,
              plan: aiTokens.plan,
            })}{' '}
            <a
              href="https://activepieces.com/docs/admin-console/manage-ai-providers#ai-credits-explained"
              target="_blank"
              className="text-primary hover:underline"
              rel="noopener noreferrer"
            >
              {t('AI Credits')}
            </a>
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

export {
  ProgressCircularComponent,
  AiCreditsAndTasksProgress as TasksProgress,
};
