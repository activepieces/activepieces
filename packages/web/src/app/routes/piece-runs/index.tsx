import { PieceRunsTable } from '@/features/piece-runs/components/piece-runs-table';

import { RunsLayout } from '../runs/runs-layout';

const PieceRunsPage = () => {
  return (
    <RunsLayout>
      <PieceRunsTable />
    </RunsLayout>
  );
};

export { PieceRunsPage };
