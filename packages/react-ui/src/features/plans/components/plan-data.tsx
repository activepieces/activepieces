import { t } from 'i18next';
import React from 'react';

import { formatUtils } from '@/lib/utils';

type PlanDataProps = {
  includedUsers: number;
  includedTasks: number;
};

const PlanData: React.FC<PlanDataProps> = ({
  includedUsers,
  includedTasks,
}) => {
  const dataArray = [
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
    <div className="flex flex-col justify-center h-full ">
      {dataArray.map((item, index) => (
        <span key={index}>
          <strong>{item.title}:</strong> {item.data}
        </span>
      ))}
    </div>
  );
};

export { PlanData };
