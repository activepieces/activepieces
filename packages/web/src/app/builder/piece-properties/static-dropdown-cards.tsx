import { DropdownOption } from '@activepieces/pieces-framework';
import React from 'react';

import { cn } from '@/lib/utils';

import { propertyIcons } from './property-icons';

function StaticDropdownCards({
  options,
  value,
  onChange,
  disabled,
}: StaticDropdownCardsProps) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const selected = value === option.value;
        const Icon = propertyIcons.get(option.icon);
        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-w-32 flex-1 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-8/50',
              selected
                ? 'border-accent-9 bg-accent-3'
                : 'border-gray-6 bg-gray-1 hover:bg-gray-3/50',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            {Icon && (
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors',
                  selected
                    ? 'bg-accent-5 text-accent-11'
                    : 'bg-gray-3 text-gray-11',
                )}
              >
                <Icon className="size-4" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-12">
                {option.label}
              </span>
              {option.description && (
                <span className="block truncate text-sm text-gray-11">
                  {option.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

StaticDropdownCards.displayName = 'StaticDropdownCards';

export { StaticDropdownCards };

type StaticDropdownCardsProps = {
  options: DropdownOption<unknown>[];
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
};
