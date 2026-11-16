import { createAction, Property } from '@activepieces/pieces-framework';
import { seventeenTrackAuth } from '../auth';
import { seventeenTrackClient } from '../client';

export const listTrackings = createAction({
  name: 'list_trackings',
  classification: 'READ',
  displayName: 'List Trackings',
  description: 'List registered 17TRACK shipments with status and pagination filters',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists registered 17TRACK shipments with pagination and optional package status filter. Read-only and idempotent.',
    idempotent: true,
  },
  auth: seventeenTrackAuth,
  props: {
    page_no: Property.Number({
      displayName: 'Page Number',
      description: 'The result page number, starting from 0',
      required: false,
      defaultValue: 0,
    }),
    package_status: Property.StaticDropdown({
      displayName: 'Package Status',
      description: 'Filter by current main package status',
      required: false,
      options: {
        options: [
          { label: 'Not Found', value: 'NotFound' },
          { label: 'Info Received', value: 'InfoReceived' },
          { label: 'In Transit', value: 'InTransit' },
          { label: 'Expired', value: 'Expired' },
          { label: 'Available For Pickup', value: 'AvailableForPickup' },
          { label: 'Out For Delivery', value: 'OutForDelivery' },
          { label: 'Delivery Failure', value: 'DeliveryFailure' },
          { label: 'Delivered', value: 'Delivered' },
          { label: 'Exception', value: 'Exception' },
        ],
      },
    }),
  },
  async run(context) {
    const { page_no, package_status } = context.propsValue;
    return await seventeenTrackClient.listTrackings({
      apiKey: context.auth.secret_text,
      page_no: page_no ?? 0,
      ...(package_status ? { package_status } : {}),
    });
  },
});
