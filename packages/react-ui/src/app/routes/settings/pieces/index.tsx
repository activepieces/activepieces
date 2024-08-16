import PiecesTable from '@/features/pieces/components/piece-table';

export default function PiecesPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <PiecesTable />
    </div>
  );
}