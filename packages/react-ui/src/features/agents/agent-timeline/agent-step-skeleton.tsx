import { t } from 'i18next';
import { useEffect, useState } from 'react';

export const AgentStepSkeleton = () => {
  const [dots, setDots] = useState('...');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === '....' ? '.' : `${prev}.`));
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center text-sm font-medium gap-3">
      {`${t('Working my magic')} ${dots}`}
    </div>
  );
};
