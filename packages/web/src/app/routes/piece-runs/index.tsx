import { AdhocRunsTable } from '@/features/adhoc-runs/components/adhoc-runs-table';

import { RunsLayout } from '../runs/runs-layout';

const PieceRunsPage = () => {
  return (
    <RunsLayout>
      <AdhocRunsTable />
    </RunsLayout>
  );
};

export { PieceRunsPage };
