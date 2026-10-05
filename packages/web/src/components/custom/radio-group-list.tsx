import { cn } from '@/lib/utils';

import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

import { CardListItem } from './card-list';

export type RadioGroupListItem<T> = {
  label: string;
  value: T;
  labelExtra?: React.ReactNode;
  description?: string;
};
const RadioGroupList = <T,>({
  items,
  onChange,
  value,
  onHover,
  className,
}: {
  items: RadioGroupListItem<T>[];
  onChange: (value: T) => void;
  value: T | null;
  onHover?: (value: T | null) => void;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <RadioGroup value={JSON.stringify(value)}>
        {items.map((item, index) => {
          const selected = item.value === value;
          return (
            <CardListItem
              key={index}
              className={cn(
                'block rounded-xl border p-3 hover:border-accent-7 hover:bg-gray-2',
                {
                  'border-accent-9 bg-accent-3': selected,
                },
              )}
              onClick={() => onChange(item.value)}
              onMouseEnter={() => onHover && onHover(item.value)}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <div className="mb-1 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-medium">
                  {item.label}
                  {item.labelExtra}
                </h4>
                <RadioGroupItem
                  value={JSON.stringify(item.value)}
                ></RadioGroupItem>
              </div>
              <div className="text-xs text-gray-11">{item.description}</div>
            </CardListItem>
          );
        })}
      </RadioGroup>
    </div>
  );
};

RadioGroupList.displayName = 'RadioGroupList';
export { RadioGroupList };
