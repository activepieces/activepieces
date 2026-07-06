import { RunsTable } from '@/features/flow-runs';

import { RunsLayout } from './runs-layout';

const RunsPage = () => {
  return (
    <RunsLayout>
      <RunsTable />
    </RunsLayout>
  );
};

export { RunsPage };
