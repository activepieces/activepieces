import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';

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
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={toggleVisibility}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {label}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2 min-w-0">
          <div className="relative min-w-0">
            <pre className="bg-muted/50 whitespace-pre-wrap break-all rounded-md px-4 py-4 text-xs overflow-x-auto max-w-full">
              <code>{jsonString}</code>
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton textToCopy={jsonString} />
            </div>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

type CollapsibleJsonProps = {
  json: unknown;
  label: string;
  description?: string;
  defaultOpen?: boolean;
  className?: string;
};
