import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Customer } from '../common/types';

export const findCustomer = createAction({
  auth: helpScoutAuth,
  name: 'find-customer',
  displayName: 'Find Customer',
  description: 'Searches for a customer by email or other criteria',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'What to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Customer ID', value: 'id' },
          { label: 'Name', value: 'name' },
          { label: 'Organization', value: 'organization' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    includeContactInfo: Property.Checkbox({
      displayName: 'Include Contact Info',
      description: 'Include emails, phones, social profiles, and websites',
      required: false,
      defaultValue: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const {
      searchBy,
      searchValue,
      includeContactInfo,
      limit,
    } = context.propsValue;

    let customers: Customer[] = [];

    try {
      if (searchBy === 'id') {
        // Search by specific customer ID
        const embed = includeContactInfo ? 'emails,phones,social,websites' : '';
        const customer = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          `/customers/${searchValue}`,
          undefined,
          embed ? { embed } : undefined
        );
        customers = [customer];
      } else {
        // Search using query parameters
        const queryParams: any = {
          sortField: 'createdAt',
          sortOrder: 'desc',
        };

        if (includeContactInfo) {
          queryParams.embed = 'emails,phones,social,websites';
        }

        switch (searchBy) {
          case 'email':
            queryParams.email = searchValue;
            break;
          case 'name':
            queryParams.firstName = searchValue;
            break;
          case 'organization':
            queryParams.organization = searchValue;
            break;
        }

        const response = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          '/customers',
          undefined,
          queryParams
        );

        customers = response._embedded.customers || [];

        // For name search, also try lastName if firstName didn't yield results
        if (searchBy === 'name' && customers.length === 0) {
          const lastNameQuery = {
            ...queryParams,
            lastName: searchValue,
          };
          delete lastNameQuery.firstName;

          const lastNameResponse = await helpScoutCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/customers',
            undefined,
            lastNameQuery
          );

          customers = lastNameResponse._embedded.customers || [];
        }
      }

      // Apply limit if specified
      if (limit && customers.length > limit) {
        customers = customers.slice(0, limit);
      }

      return {
        success: true,
        customers,
        total: customers.length,
      };
    } catch (error: any) {
      if (error.toString().includes('404')) {
        return {
          success: true,
          customers: [],
          total: 0,
          message: 'No customers found matching the criteria',
        };
      }
      throw new Error(`Failed to find customers: ${error}`);
    }
  },
});