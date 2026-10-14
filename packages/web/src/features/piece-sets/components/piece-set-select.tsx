import { PieceSet } from '@activepieces/shared';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function PieceSetSelect({
  value,
  onValueChange,
  pieceSets,
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: PieceSetSelectProps) {
  const ordered = [
    ...pieceSets.filter((set) => set.isDefault),
    ...pieceSets.filter((set) => !set.isDefault),
  ];
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn('min-w-0', className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ordered.map((set) => (
          <SelectItem key={set.id} value={set.id}>
            {set.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type PieceSetSelectProps = {
  value: string | undefined;
  onValueChange: (value: string) => void;
  pieceSets: PieceSet[];
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};
