import { ArrowLeft } from 'lucide-react';

export function BackLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-[15px]" />
      {label}
    </button>
  );
}
