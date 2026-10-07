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
    className="flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-dashed border-gray-6 px-[11px] py-[9px] text-[13px] font-medium leading-4 text-gray-11 transition-colors hover:border-gray-8 hover:bg-gray-4 hover:text-gray-12 disabled:opacity-50"
  >
    <Plus className="size-3.5" />
    {label}
  </button>
);
