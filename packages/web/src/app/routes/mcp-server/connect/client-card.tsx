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
          ? 'border-primary bg-primary/5'
          : 'hover:border-ring hover:bg-accent/40',
      )}
    >
      <ClientIcon icon={client.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-semibold">{client.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {client.setupHint}
        </span>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
