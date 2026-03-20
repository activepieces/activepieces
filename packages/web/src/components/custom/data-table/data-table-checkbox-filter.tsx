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
        'flex items-center space-x-2 border-dashed rounded-md px-3 py-2 h-9',
        'hover:bg-accent/5',
        checked && 'bg-accent/10 border-accent text-accent-foreground',
      )}
      onClick={() => handleCheckedChange(!checked)}
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      <Label className="text-sm font-medium leading-none select-none cursor-pointer">
        {label}
      </Label>
    </Button>
  );
}
