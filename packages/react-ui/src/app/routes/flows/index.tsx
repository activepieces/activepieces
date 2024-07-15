import { FlowsTable } from '@/features/flows/components/flow-table';

const FlowsPage = () => {
  return (
    <div className="container mx-auto flex py-10">
      <FlowsTable></FlowsTable>
    </div>
  );
};

FlowsPage.displayName = 'FlowsPage';

export { FlowsPage };
