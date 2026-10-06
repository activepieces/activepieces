import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DataTableCheckboxProps = {
  label: string;
  checked: boolean;
  handleCheckedChange: (checked: boolean) => void;
};

export function DataTableInputCheckbox({
  label,
  checked,
  handleCheckedChange,
}: DataTableCheckboxProps) {
  return (
    <Label
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'cursor-pointer border-dashed font-medium select-none',
        checked && 'bg-gray-3 border-gray-8 text-gray-12',
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => handleCheckedChange(next === true)}
      />
      {label}
    </Label>
  );
}
