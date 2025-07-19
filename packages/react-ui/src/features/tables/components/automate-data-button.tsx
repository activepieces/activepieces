import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useTableState } from './ap-table-state-provider';
import { tablesApi } from '../lib/tables-api';
import { useToast } from '@/components/ui/use-toast';

const AutomateDataButton = () => {
  const [table, records, selectedRecords, serverRecords, setSelectedRecords] = useTableState((state) => [
    state.table,
    state.records,
    state.selectedRecords,
    state.serverRecords,
    state.setSelectedRecords,
  ]);
  const { toast } = useToast();

  const automateMutation = useMutation({
    mutationFn: async (recordIds: string[]) => {
      return await tablesApi.automate(table.id, { recordIds });
    },
    onSuccess: () => {
      setSelectedRecords(new Set());
    },
    onError: (_error) => {
      toast({
        title: 'Automation Failed',
        description: 'Failed to start automation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleAutomate = () => {
    const recordIdsIndices = Array.from(selectedRecords).map((recordId) => records.findIndex((record) => record.uuid === recordId));
    const recordIdsToAutomate = recordIdsIndices.map((recordIndex) => serverRecords[recordIndex].id);
    automateMutation.mutate(recordIdsToAutomate);
  };

  if (selectedRecords.size === 0) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      onClick={handleAutomate}
      disabled={automateMutation.isPending}
    >
      <Bot className="mr-2 w-4" />
      {automateMutation.isPending
        ? 'Starting...'
        : `Automate (${selectedRecords.size})`}
    </Button>
  );
};

export { AutomateDataButton }; 