import { Button } from '@/components/ui/button';
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
    <Button
      type="button"
      variant="outline"
      className={cn(
        'border-dashed',
        checked && 'bg-gray-3 border-gray-8 text-gray-12',
      )}
      onClick={() => handleCheckedChange(!checked)}
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      <Label className="cursor-pointer font-medium select-none">{label}</Label>
    </Button>
  );
}
