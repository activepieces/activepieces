import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ConfirmDialog, useAdminAction } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { EVENT_STREAMING_PATH } from '../lib/event-streaming-path';

const EventDestinationActions = ({
  destination,
}: {
  destination: EventDestination;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const deleteDestination = useAdminAction({
    verb: 'delete',
    name: t('Destination'),
    run: () => eventDestinationsCollectionUtils.delete([destination.id]),
  });

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        modal={true}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t('Open menu')}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            {...adminControl(
              AdminControl.EVENT_DESTINATIONS_DESTINATION_EDIT_OPEN,
            )}
            asChild
          >
            <Link to={`${EVENT_STREAMING_PATH}/${destination.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('Edit')}
            </Link>
          </DropdownMenuItem>

          <ConfirmDialog
            title={t('Delete destination')}
            description={destination.url}
            consequence={t('Events will stop being sent to this destination.')}
            confirmLabel={t('Delete')}
            onConfirm={() => deleteDestination.mutateAsync()}
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
          </ConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
