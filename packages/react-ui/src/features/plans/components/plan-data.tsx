import React from 'react';

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
      title: 'Sync Time',
      data: `${minimumPollingInterval} minute${addPostfixToMinute}`,
    },
    {
      title: 'Included Team Members',
      data: includedUsers === -1 ? 'Unlimited' : includedUsers,
    },
    {
      title: 'Included Tasks',
      data: includedTasks,
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
