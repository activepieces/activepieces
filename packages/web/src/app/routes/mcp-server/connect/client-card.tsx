import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { CatalogClient } from '../mcp-client-catalog';

export function ClientCard({
  client,
  highlighted = false,
  onClick,
}: {
  client: CatalogClient;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors',
        highlighted
          ? 'border-accent-9 bg-accent-3'
          : 'hover:border-accent-8 hover:bg-gray-4/40',
      )}
    >
      <ClientIcon icon={client.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-semibold">{client.name}</span>
        <span className="truncate text-sm text-gray-11">
          {client.setupHint}
        </span>
      </div>
      <ChevronRight className="size-4 shrink-0 text-gray-11" />
    </button>
  );
}
