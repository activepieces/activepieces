import { Plus } from 'lucide-react';

export const AddRow = ({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    className="flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-dashed border-border px-[11px] py-[9px] text-[13px] font-medium leading-4 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-accent hover:text-foreground disabled:opacity-50"
  >
    <Plus className="size-3.5" />
    {label}
  </button>
);
