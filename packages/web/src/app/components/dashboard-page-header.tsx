import { SampleTierPill } from '@/components/custom/feature-sample';
import { PageHeader } from '@/components/custom/page-header';

import { SampleUpgradeButton } from './feature-sample';

export const DashboardPageHeader = ({
  title,
  children,
  description,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  return (
    <PageHeader
      title={
        <div className="flex items-center gap-2">
          {typeof title === 'string' ? (
            <h1 className="text-base font-semibold">{title}</h1>
          ) : (
            title
          )}
          <SampleTierPill />
        </div>
      }
      description={description}
      rightContent={
        <div className="flex items-center gap-2">
          <SampleUpgradeButton />
          {children}
        </div>
      }
      className="min-w-full"
    />
  );
};
