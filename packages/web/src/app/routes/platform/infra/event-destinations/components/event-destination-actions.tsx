import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INTERNAL_ERROR_MESSAGE } from '@/components/ui/sonner';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

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
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <EventDestinationDialog destination={destination}>
            <DropdownMenuItem
              {...adminControl(
                AdminControl.EVENT_DESTINATIONS_DESTINATION_EDIT_OPEN,
              )}
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
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
              await eventDestinationsCollectionUtils.delete([destination.id])
                .isPersisted.promise;
            }}
            onError={(error) => {
              toast.error(t('Error'), {
                description: api.extractServerErrorMessage(
                  error,
                  INTERNAL_ERROR_MESSAGE,
                ),
              });
            }}
            isDanger
            controlId={
              AdminControl.EVENT_DESTINATIONS_DESTINATION_DELETE_CONFIRM
            }
          >
            <DropdownMenuItem
              {...adminControl(
                AdminControl.EVENT_DESTINATIONS_DESTINATION_DELETE_OPEN,
              )}
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
