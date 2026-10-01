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
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        highlighted ? 'border-accent-8 bg-accent-3' : 'hover:bg-gray-3',
      )}
    >
      <ClientIcon icon={client.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{client.name}</span>
        <span className="truncate text-xs text-gray-11">
          {client.setupHint}
        </span>
      </div>
      <ChevronRight className="size-4 shrink-0 text-gray-11" />
    </button>
  );
}
