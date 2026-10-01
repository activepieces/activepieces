import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

import { EventDestinationDialog } from './event-destination-dialog';

const EventDestinationActions = ({
  destination,
  flowId,
}: {
  destination: EventDestination;
  flowId?: string;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        modal={true}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Destination actions')}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <EventDestinationDialog destination={destination}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Pencil />
              {t('Edit destination')}
            </DropdownMenuItem>
          </EventDestinationDialog>
          {flowId && (
            <DropdownMenuItem
              onSelect={() =>
                window.open(`/flows/${flowId}`, '_blank', 'noopener,noreferrer')
              }
            >
              <ExternalLink />
              {t('Open flow')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <ConfirmDialog
            title={t('Delete destination?')}
            description={t('Events stop being sent here immediately.')}
            confirmLabel={t('Delete')}
            successMessage={t('Deleted {name}', { name: t('destination') })}
            onConfirm={async () => {
              eventDestinationsCollectionUtils.delete([destination.id]);
            }}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Trash2 />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
