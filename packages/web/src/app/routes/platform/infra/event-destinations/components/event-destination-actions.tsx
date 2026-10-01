import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

import { EventDestinationDialog } from './event-destination-dialog';

const EventDestinationActions = ({
  destination,
}: {
  destination: EventDestination;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu
        modal={true}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <EventDestinationDialog destination={destination}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Pencil />
              {t('Edit')}
            </DropdownMenuItem>
          </EventDestinationDialog>

          <ConfirmDialog
            title={t('Delete destination')}
            description={t(
              'Deleting this destination will stop all event notifications to its webhook.',
            )}
            confirmLabel={t('Delete')}
            successMessage={t('Deleted {name}', { name: t('destination') })}
            onConfirm={async () => {
              if (destination) {
                eventDestinationsCollectionUtils.delete([destination.id]);
              }
            }}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Trash />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
