import { ActionRunsTable } from '@/features/action-runs/components/action-runs-table';

import { RunsLayout } from '../runs/runs-layout';

const ActionRunsPage = () => {
  return (
    <RunsLayout>
      <ActionRunsTable />
    </RunsLayout>
  );
};

export { ActionRunsPage };
