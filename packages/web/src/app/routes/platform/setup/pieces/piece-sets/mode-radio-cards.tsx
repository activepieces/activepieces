import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export function ModeRadioCards<TValue extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: TValue;
  options: { value: TValue; label: string; description: string }[];
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold">{title}</span>
      <RadioGroup
        value={value}
        onValueChange={(newValue) => {
          const option = options.find((option) => option.value === newValue);
          if (option) {
            onChange(option.value);
          }
        }}
        className="grid grid-cols-2 gap-3"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 transition-colors',
              option.value === value
                ? 'border-accent-9 bg-accent-3'
                : 'hover:bg-gray-3/50',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <RadioGroupItem value={option.value} />
              {option.label}
            </span>
            <span className="text-sm text-gray-11">{option.description}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
