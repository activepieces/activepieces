import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { ClientIcon } from '../client-icon';
import { grantUtils } from '../grants/grant-utils';
import { CatalogClient } from '../mcp-client-catalog';

import { ClientStatus } from './use-connect-home';

export function ClientTile({
  client,
  status,
  isStatusLoading,
  onOpen,
}: {
  client: CatalogClient;
  status: ClientStatus | undefined;
  isStatusLoading: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-19 min-w-0 items-center gap-3.5 rounded-[14px] border bg-panel pl-3.5 pr-4 text-left transition-[border-color,scale] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gray-8 active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-9"
    >
      <ClientIcon icon={client.icon} className="size-12 rounded-xl" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base/5 font-semibold text-gray-12">
          {client.name}
        </span>
        <span className="flex h-4.5 min-w-0 items-center gap-1.5 text-sm/4.5 text-gray-11">
          {isStatusLoading ? (
            <Skeleton className="h-3 w-24" />
          ) : (
            <>
              {status && (
                <span className="size-1.5 shrink-0 rounded-full bg-success-10" />
              )}
              <span className="truncate">
                {status
                  ? grantUtils.connectedLabel(status.lastUsedAt)
                  : setupLabel(client)}
              </span>
            </>
          )}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-gray-9 transition-[color,translate] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:text-gray-12" />
    </button>
  );
}

function setupLabel(client: CatalogClient): string {
  return client.group === 'other' ? t('URL or config') : client.setupHint;
}
