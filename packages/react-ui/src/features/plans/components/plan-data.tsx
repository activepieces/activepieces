import { t } from 'i18next';
import React from 'react';

import { formatUtils } from '@/lib/utils';

type PlanDataProps = {
  minimumPollingInterval: number;
  includedUsers: number;
  includedTasks: number;
};

const PlanData: React.FC<PlanDataProps> = ({
  minimumPollingInterval,
  includedUsers,
  includedTasks,
}) => {
  const addPostfixToMinute = minimumPollingInterval > 1 ? 's' : '';

  const dataArray = [
    {
      title: t('Sync Time'),
      data: `${minimumPollingInterval} ${t('minute')}${addPostfixToMinute}`,
    },
    {
      title: t('Included Team Members'),
      data: includedUsers === -1 ? t('Unlimited') : includedUsers,
    },
    {
      title: t('Included Tasks'),
      data: formatUtils.formatNumber(includedTasks),
    },
  ];

  return (
    <div className="flex flex-col justify-center pl-[20%]">
      {dataArray.map((item, index) => (
        <span key={index}>
          <strong>{item.title}:</strong> {item.data}
        </span>
      ))}
    </div>
  );
};

export { PlanData };
