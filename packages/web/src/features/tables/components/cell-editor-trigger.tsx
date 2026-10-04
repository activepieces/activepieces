import { PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function CellEditorTrigger({
  isEditing,
  children,
}: {
  isEditing: boolean;
  children: React.ReactNode;
}) {
  return (
    <PopoverTrigger asChild>
      <button
        className={cn(
          'w-full h-full flex items-center justify-between gap-2',
          'bg-gray-1 text-sm px-2',
          'focus:outline-hidden',
          {
            'border-2 border-accent-9': isEditing,
            'border-transparent bg-transparent!': !isEditing,
          },
        )}
      >
        {children}
      </button>
    </PopoverTrigger>
  );
}
