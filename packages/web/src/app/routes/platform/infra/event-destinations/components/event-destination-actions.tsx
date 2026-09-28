import { EventDestination } from '@activepieces/shared';
import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <EventDestinationDialog destination={destination}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 mr-2" />
              {t('Edit')}
            </DropdownMenuItem>
          </EventDestinationDialog>

          <ConfirmationDeleteDialog
            title={t('Delete destination')}
            message={t(
              'Deleting this destination will stop all event notifications to its webhook.',
            )}
            entityName={t('destination')}
            buttonText={t('Delete')}
            showToast
            mutationFn={async () => {
              if (destination) {
                eventDestinationsCollectionUtils.delete([destination.id]);
              }
            }}
            isDanger
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
