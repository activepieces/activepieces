import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters
} from '../../../common/utils';
import { BookingRequestCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/booking-requests/v1.0
export const bookingRequestCreateAction = createAction({
  auth: ampecoAuth,
  name: 'bookingRequestCreate',
  displayName: 'Resources - Booking Requests - Create',
  description:
    'Create a new booking request. If you want to find the available slots for a given location use the Actions / Location / Check Booking Availability.',
  props: {
    requestBody_VariantType: Property.StaticDropdown({
      displayName: 'Request Body Variant Type',
      description: 'Select the type of the variant',
      required: true,
      options: {
        options: [
          { label: 'Create Booking', value: '1' },
          { label: 'Update the given Booking', value: '2' },
          { label: 'Cancel Booking', value: '3' },
        ],
      },
    }),

    requestBody: Property.DynamicProperties({
      displayName: 'Request Body',
      required: true,
      auth: ampecoAuth,
      refreshers: ['requestBody_VariantType'],
      props: async ({ requestBody_VariantType }) => {
        if (!requestBody_VariantType) {
          return {};
        }

        type VariantKey = '1' | '2' | '3';

        const variantMap = {
          '1': {
            type: Property.StaticDropdown({
              displayName: 'Type',
              description: 'Type of booking request - must be "create".',
              required: true,
              options: {
                options: [{ label: 'create', value: 'create' }],
              },
            }),

            userId: Property.Number({
              displayName: 'User Id',
              description: 'ID of the user for whom the booking is made.',
              required: true,
            }),

            locationId: Property.Number({
              displayName: 'Location Id',
              description: 'ID of the target location.',
              required: true,
            }),

            evseId: Property.Number({
              displayName: 'Evse Id',
              description:
                'Specific EVSE ID (optional - if not provided, system will choose any available EVSE).',
              required: false,
            }),

            currentType: Property.StaticDropdown({
              displayName: 'Evse Criteria - Current Type',
              description:
                'Type of current available on the EVSE: - **ac**: Alternating Current (AC) charging - **dc**: Direct Current (DC) fast charging.',
              required: false,
              options: {
                options: [
                  { label: 'ac', value: 'ac' },
                  { label: 'dc', value: 'dc' },
                ],
              },
            }),

            minPower: Property.Number({
              displayName: 'Evse Criteria - Min Power',
              description: 'Minimum power requirement (kW).',
              required: false,
            }),

            maxPower: Property.Number({
              displayName: 'Evse Criteria - Max Power',
              description: 'Maximum power requirement (kW).',
              required: false,
            }),

            connectorType: Property.StaticDropdown({
              displayName: 'Evse Criteria - Connector Type',
              description:
                'Type of connector available on the EVSE: - **type1**: Type 1 connector (SAE J1772 AC) - **type2**: Type 2 connector (IEC 62196-2 AC) - **type3**: Type 3 connector (IEC 62196-2 AC) - **chademo**: CHAdeMO DC fast charging - **ccs1**: Combined Charging System 1 (CCS1/Combo 1) - **ccs2**: Combined Charging System 2 (CCS2/Combo 2) - **schuko**: Standard European household socket - **nacs**: North American Charging Standard (Tesla) - **cee16**: CEE 16A industrial connector - **cee32**: CEE 32A industrial connector - **j1772**: SAE J1772 connector - **inductive**: Inductive/wireless charging - **nema-5-20**: Domestic M NEMA 5-20 Socket - **type-e-french**: French Type E socket - **type-g-british**: British Type G socket - **type-j-swiss**: Swiss Type J socket - **avcon**: AVCON connector (Australian standard) - **gb-t-ac**: GB/T AC connector (Chinese standard) - **gb-t-dc**: GB/T DC connector (Chinese standard) - **chaoji**: ChaoJi (CHAdeMO 3.0) - **nema-6-30**: NEMA 6-30 - **nema-6-50**: NEMA 6-50.',
              required: false,
              options: {
                options: [
                  { label: 'type1', value: 'type1' },
                  { label: 'type2', value: 'type2' },
                  { label: 'type3', value: 'type3' },
                  { label: 'chademo', value: 'chademo' },
                  { label: 'ccs1', value: 'ccs1' },
                  { label: 'ccs2', value: 'ccs2' },
                  { label: 'schuko', value: 'schuko' },
                  { label: 'nacs', value: 'nacs' },
                  { label: 'cee16', value: 'cee16' },
                  { label: 'cee32', value: 'cee32' },
                  { label: 'j1772', value: 'j1772' },
                  { label: 'inductive', value: 'inductive' },
                  { label: 'nema-5-20', value: 'nema-5-20' },
                  { label: 'type-e-french', value: 'type-e-french' },
                  { label: 'type-g-british', value: 'type-g-british' },
                  { label: 'type-j-swiss', value: 'type-j-swiss' },
                  { label: 'avcon', value: 'avcon' },
                  { label: 'gb-t-ac', value: 'gb-t-ac' },
                  { label: 'gb-t-dc', value: 'gb-t-dc' },
                  { label: 'chaoji', value: 'chaoji' },
                  { label: 'nema-6-30', value: 'nema-6-30' },
                  { label: 'nema-6-50', value: 'nema-6-50' },
                ],
              },
            }),

            startAt: Property.DateTime({
              displayName: 'Start At',
              description: 'Start time of the booking.',
              required: true,
            }),

            endAt: Property.DateTime({
              displayName: 'End At',
              description: 'End time of the booking.',
              required: true,
            }),
          },
          '2': {
            type: Property.StaticDropdown({
              displayName: 'Type',
              description: 'Type of booking request - must be "update".',
              required: true,
              options: {
                options: [{ label: 'update', value: 'update' }],
              },
            }),

            bookingId: Property.Number({
              displayName: 'Booking Id',
              description: 'ID of the target booking to update.',
              required: true,
            }),

            userId: Property.Number({
              displayName: 'User Id',
              description: 'ID of the user for whom the booking is made.',
              required: false,
            }),

            startAt: Property.DateTime({
              displayName: 'Start At',
              description: 'Updated start time of the booking.',
              required: false,
            }),

            endAt: Property.DateTime({
              displayName: 'End At',
              description: 'Updated end time of the booking.',
              required: false,
            }),
          },
          '3': {
            type: Property.StaticDropdown({
              displayName: 'Type',
              description: 'Type of booking request - must be "cancel".',
              required: true,
              options: {
                options: [{ label: 'cancel', value: 'cancel' }],
              },
            }),

            bookingId: Property.Number({
              displayName: 'Booking Id',
              description: 'ID of the target booking to cancel.',
              required: true,
            }),
          },
        };

        const key = requestBody_VariantType as unknown as string;
        if (key in variantMap) {
          return variantMap[key as VariantKey];
        }
        return {};
      },
    }),
  },
  async run(context): Promise<BookingRequestCreateResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/booking-requests/v1.0',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, [
        'requestBody_VariantType',
        'type',
        'userId',
        'locationId',
        'evseId',
        'currentType',
        'minPower',
        'maxPower',
        'connectorType',
        'startAt',
        'endAt',
        'bookingId',
      ]);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      )) as BookingRequestCreateResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
