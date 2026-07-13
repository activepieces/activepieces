import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const AlertSwitchRow = ({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: AlertSwitchRowProps) => (
  <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
    <div className="flex flex-col gap-0.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
    <Switch
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
    />
  </div>
);

type AlertSwitchRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
};
