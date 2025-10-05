import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const createBooking = createAction({
  auth: simplybookAuth,
  name: 'create_booking',
  displayName: 'Create Booking',
  description: 'Create a new booking with required booking parameters',
  props: {
    startDatetime: Property.ShortText({
      displayName: 'Start Date Time',
      description: 'Booking start datetime (format: YYYY-MM-DD HH:MM:SS, e.g., 2020-12-02 09:30:00)',
      required: true
    }),
    endDatetime: Property.ShortText({
      displayName: 'End Date Time',
      description: 'Booking end datetime (format: YYYY-MM-DD HH:MM:SS)',
      required: false
    }),
    serviceId: Property.Number({
      displayName: 'Service ID',
      description: 'The ID of the service to book',
      required: true
    }),
    providerId: Property.Number({
      displayName: 'Provider ID',
      description: 'The ID of the service provider',
      required: true
    }),
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'The ID of the client making the booking',
      required: true
    }),
    locationId: Property.Number({
      displayName: 'Location ID',
      description: 'The ID of the location',
      required: false
    }),
    categoryId: Property.Number({
      displayName: 'Category ID',
      description: 'The ID of the service category',
      required: false
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Group booking count (number of people)',
      required: false,
      defaultValue: 1
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Array of additional field values (e.g., [{"field": "field_id", "value": "value"}])',
      required: false
    }),
    products: Property.Json({
      displayName: 'Products (Addons)',
      description: 'Array of products/addons (e.g., [{"id": 1, "qty": 2}])',
      required: false
    }),
    clientMembershipId: Property.Number({
      displayName: 'Client Membership ID',
      description: 'Client membership instance ID',
      required: false
    }),
    skipMembership: Property.Checkbox({
      displayName: 'Skip Membership',
      description: 'Do not use membership for this booking',
      required: false,
      defaultValue: false
    }),
    userStatusId: Property.Number({
      displayName: 'User Status ID',
      description: 'User status ID',
      required: false
    }),
    acceptPayment: Property.Checkbox({
      displayName: 'Accept Payment',
      description: 'Set true to make payment order for booking',
      required: false,
      defaultValue: false
    }),
    paymentProcessor: Property.ShortText({
      displayName: 'Payment Processor',
      description: 'Payment processor name',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const bookingData: any = {
      start_datetime: context.propsValue.startDatetime,
      service_id: context.propsValue.serviceId,
      provider_id: context.propsValue.providerId,
      client_id: context.propsValue.clientId,
      count: context.propsValue.count || 1
    };

    // Add optional fields
    if (context.propsValue.endDatetime) {
      bookingData.end_datetime = context.propsValue.endDatetime;
    }
    if (context.propsValue.locationId) {
      bookingData.location_id = context.propsValue.locationId;
    }
    if (context.propsValue.categoryId) {
      bookingData.category_id = context.propsValue.categoryId;
    }
    if (context.propsValue.additionalFields) {
      bookingData.additional_fields = context.propsValue.additionalFields;
    }
    if (context.propsValue.products) {
      bookingData.products = context.propsValue.products;
    }
    if (context.propsValue.clientMembershipId) {
      bookingData.client_membership_id = context.propsValue.clientMembershipId;
    }
    if (context.propsValue.skipMembership) {
      bookingData.skip_membership = context.propsValue.skipMembership;
    }
    if (context.propsValue.userStatusId) {
      bookingData.user_status_id = context.propsValue.userStatusId;
    }
    if (context.propsValue.acceptPayment) {
      bookingData.accept_payment = context.propsValue.acceptPayment;
    }
    if (context.propsValue.paymentProcessor) {
      bookingData.payment_processor = context.propsValue.paymentProcessor;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://user-api-v2.simplybook.me/admin/bookings',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        },
        body: bookingData
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to create booking: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }
});
