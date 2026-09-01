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
    className="mt-[7px] flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-dashed border-neutral-300 px-[11px] py-[9px] text-[13px] font-medium leading-4 text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-accent disabled:opacity-50"
  >
    <Plus className="size-3.5" />
    {label}
  </button>
);
