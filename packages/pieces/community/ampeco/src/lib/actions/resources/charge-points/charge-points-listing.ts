import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0

export const chargePointsListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointsListing',
  displayName: 'Resources - Charge Points - Charge Points Listing',
  description: 'Get all charge points.',
  props: {
        
  filter__desiredSecurityProfileStatus: Property.StaticDropdown({
    displayName: 'Filter - Desired Security Profile Status',
    description: 'The value of the desiredSecurityProfileStatus by which to filter',
    required: false,
    options: {
      options: [
      { label: 'applied', value: 'applied' },
      { label: 'pending', value: 'pending' },
      { label: 'rejected', value: 'rejected' }
      ],
    },
  }),

  filter__evsePhysicalReference: Property.ShortText({
    displayName: 'Filter - Evse Physical Reference',
    description: 'Only list charge point, identified by evse identifier',
    required: false,
  }),

  filter__networkId: Property.ShortText({
    displayName: 'Filter - Network Id',
    description: 'Only list charge point, identified by the NetworkId',
    required: false,
  }),

  filter__bootNotificationSerialNumber: Property.ShortText({
    displayName: 'Filter - Boot Notification Serial Number',
    description: 'Only list charge points with last boot notification that had this charge_point_serial_number',
    required: false,
  }),

  filter__modelId: Property.ShortText({
    displayName: 'Filter - Model Id',
    description: 'Only list charge points, identified by modelId',
    required: false,
  }),

  filter__vendorId: Property.ShortText({
    displayName: 'Filter - Vendor Id',
    description: 'Only list charge points, identified by vendorId',
    required: false,
  }),

  filter__userId: Property.ShortText({
    displayName: 'Filter - User Id',
    description: 'Only list charge points owned by a certain user',
    required: false,
  }),

  filter__partnerId: Property.ShortText({
    displayName: 'Filter - Partner Id',
    description: 'Only list charge points owned by a certain partner',
    required: false,
  }),

  filter__type: Property.StaticDropdown({
    displayName: 'Filter - Type',
    description: 'Only list charge points with this access type',
    required: false,
    options: {
      options: [
      { label: 'public', value: 'public' },
      { label: 'private', value: 'private' },
      { label: 'personal', value: 'personal' }
      ],
    },
  }),

  filter__subOperatorId: Property.ShortText({
    displayName: 'Filter - Sub Operator Id',
    description: 'Only list charge point for a given subOperator',
    required: false,
  }),

  filter__roaming: Property.ShortText({
    displayName: 'Filter - Roaming',
    description: 'When true - returns only roaming charge points. When false - returns only local charge points.',
    required: false,
  }),

  filter__name: Property.ShortText({
    displayName: 'Filter - Name',
    description: 'Exact charge point name',
    required: false,
  }),

  filter__locationId: Property.ShortText({
    displayName: 'Filter - Location Id',
    description: 'Only list charge points assigned to the location',
    required: false,
  }),

  filter__circuitId: Property.Number({
    displayName: 'Filter - Circuit Id',
    description: 'Only list charge points added to a certain DLM Circuit',
    required: false,
  }),

  filter__chargingZoneId: Property.ShortText({
    displayName: 'Filter - Charging Zone Id',
    description: 'Only list charge point for a given Charging Zone',
    required: false,
  }),

  filter__managedByOperator: Property.ShortText({
    displayName: 'Filter - Managed By Operator',
    description: 'Only list charge points that are managed by operator or not',
    required: false,
  }),

  filter__externalId: Property.ShortText({
    displayName: 'Filter - External Id',
    description: 'Only list charge point, identified by the External ID of the charge point',
    required: false,
  }),

  filter__utilityId: Property.Number({
    displayName: 'Filter - Utility Id',
    description: '',
    required: false,
  }),

  filter__tag: Property.ShortText({
    displayName: 'Filter - Tag',
    description: 'Only list charge points that have the specific tag assigned.',
    required: false,
  }),

  filter__sharingCode: Property.ShortText({
    displayName: 'Filter - Sharing Code',
    description: 'Only list personal charge point with certain sharing code.',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the specific resource that was last updated on and after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the specific resource that was last updated on and before this datetime',
    required: false,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'lastBootNotification', value: 'lastBootNotification' },
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'smartCharging', value: 'smartCharging' },
      { label: 'smartChargingPreferences', value: 'smartChargingPreferences' },
      { label: 'personalSmartChargingPreferences', value: 'personalSmartChargingPreferences' },
      { label: 'availablePersonalSmartChargingModes', value: 'availablePersonalSmartChargingModes' }
      ],
    },
  }),
    per_page: Property.Number({
      displayName: 'Per page',
      description: 'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
      required: false,
      defaultValue: 100,
    }),
    usePagination: Property.Checkbox({
      displayName: 'Paginate Results',
      description: 'Whether to automatically paginate to fetch all results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context): Promise<ChargePointsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'include', 'per_page', 'cursor']);
      
      const body = undefined;

          if (context.propsValue.usePagination) {
      return await paginate({
        auth: context.auth,
        method: 'GET',
        path: url,
        queryParams,
        body,
        perPage: context.propsValue.per_page ?? 100,
        dataPath: 'data',
      }) as ChargePointsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
