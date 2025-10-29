import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth, bigCommerceCommon } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateCustomerAddress = createAction({
  auth: bigCommerceAuth,
  name: 'find_or_create_customer_address',
  displayName: "Find or Create Customer's Address",
  description: "Find an existing customer address or create a new one if not found",
  props: {
    customer_id: bigCommerceCommon.customer_id,
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name associated with this address',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name associated with this address',
      required: true,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'The street address (e.g., 123 Main St) - used for matching',
      required: true,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Additional address information (e.g., Apt 4B, Suite 200)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city name',
      required: true,
    }),
    state_or_province: bigCommerceCommon.state_or_province,
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'The postal or ZIP code',
      required: true,
    }),
    country_code: bigCommerceCommon.country_code,
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number for this address',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name for this address',
      required: false,
    }),
    address_type: bigCommerceCommon.address_type,
  },
  async run(context) {
    const {
      customer_id,
      first_name,
      last_name,
      address1,
      address2,
      city,
      state_or_province,
      postal_code,
      country_code,
      phone,
      company,
      address_type,
    } = context.propsValue;

    // Step 1: Search for existing address by customer_id and address1
    const searchResponse = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        customer_id: number;
        first_name: string;
        last_name: string;
        company: string;
        address1: string;
        address2: string;
        city: string;
        state_or_province: string;
        postal_code: string;
        country_code: string;
        phone: string;
        address_type: string;
      }>;
      meta: {
        pagination: {
          total: number;
        };
      };
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.GET,
      url: '/customers/addresses',
      queryParams: {
        'customer_id:in': customer_id.toString(),
        'address1:like': address1,
        limit: '10',
      },
    });

    // Check if we found a matching address
    if (searchResponse.body.data && searchResponse.body.data.length > 0) {
      // Look for an exact or close match
      const exactMatch = searchResponse.body.data.find(addr => 
        addr.address1.toLowerCase() === address1.toLowerCase() &&
        addr.city.toLowerCase() === city.toLowerCase() &&
        addr.postal_code === postal_code
      );

      if (exactMatch) {
        return {
          found: true,
          created: false,
          address: exactMatch,
          message: `Found existing address with ID: ${exactMatch.id}`,
        };
      }
    }

    // Step 2: Address not found, create a new one
    const addressData: Record<string, any> = {
      customer_id: Number(customer_id),
      first_name,
      last_name,
      address1,
      city,
      state_or_province,
      postal_code,
      country_code,
    };

    // Add optional fields
    if (address2) addressData['address2'] = address2;
    if (phone) addressData['phone'] = phone;
    if (company) addressData['company'] = company;
    if (address_type) addressData['address_type'] = address_type;

    const createResponse = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        customer_id: number;
        first_name: string;
        last_name: string;
        company: string;
        address1: string;
        address2: string;
        city: string;
        state_or_province: string;
        postal_code: string;
        country_code: string;
        phone: string;
        address_type: string;
      }>;
      meta: Record<string, any>;
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.POST,
      url: '/customers/addresses',
      body: [addressData],
    });

    const newAddress = createResponse.body.data[0];
    return {
      found: false,
      created: true,
      address: newAddress,
      message: `Created new address with ID: ${newAddress.id}`,
    };
  },
});
