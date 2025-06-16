import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OptionalNumberProps {
  name: string;
  placeholder?: string;
  className?: string;
}

export function OptionalNumber({
  name,
  placeholder,
  className,
}: OptionalNumberProps) {
  const { register, setValue } = useFormContext();

  return (
    <div className="relative flex items-center">
      <Input
        type="number"
        {...register(name)}
        placeholder={placeholder}
        className={className + ' pr-16'} // add right padding for button
      />
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setValue(name, '')}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 py-0 text-xs"
        tabIndex={-1}
      >
        Clear
      </Button>
    </div>
  );
}
