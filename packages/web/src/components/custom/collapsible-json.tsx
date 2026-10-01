import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { cn } from '@/lib/utils';

export function CollapsibleJson({
  json,
  label,
  description,
  defaultOpen = false,
  className = '',
}: CollapsibleJsonProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggleVisibility = () => setIsOpen(!isOpen);

  const jsonString =
    typeof json === 'string' ? json : JSON.stringify(json, null, 2);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <button
        onClick={toggleVisibility}
        className="flex items-center gap-2 text-sm font-medium text-gray-11 transition-colors hover:text-gray-12"
      >
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        {label}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2 min-w-0">
          <div className="relative min-w-0">
            <pre className="max-w-full overflow-x-auto rounded-xl bg-gray-2 p-3 pr-12 text-xs break-all whitespace-pre-wrap">
              <code>{jsonString}</code>
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton textToCopy={jsonString} />
            </div>
          </div>
          {description && <p className="text-xs text-gray-11">{description}</p>}
        </div>
      )}
    </div>
  );
}

type CollapsibleJsonProps = {
  json: unknown;
  label: React.ReactNode;
  description?: string;
  defaultOpen?: boolean;
  className?: string;
};
