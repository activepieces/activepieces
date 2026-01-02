import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetInstallerJobsListResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/installer-jobs/v1.0
export const getInstallerJobsListAction = createAction({
  auth: ampecoAuth,
  name: 'getInstallerJobsList',
  displayName: 'Resources - Installer Jobs - Get Installer Jobs List',
  description: 'Get all Installer Jobs.',
  props: {
        
  filter__installationAndMaintenanceCompanyId: Property.Number({
    displayName: 'Filter - Installation And Maintenance Company Id',
    description: '',
    required: false,
  }),

  filter__locationId: Property.Number({
    displayName: 'Filter - Location Id',
    description: '',
    required: false,
  }),

  filter__chargePointId: Property.Number({
    displayName: 'Filter - Charge Point Id',
    description: '',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'The status of the installer job',
    required: false,
    options: {
      options: [
      { label: 'new', value: 'new' },
      { label: 'in_progress', value: 'in_progress' },
      { label: 'completed', value: 'completed' },
      { label: 'failed', value: 'failed' }
      ],
    },
  }),

  filter__installerAdminId: Property.Number({
    displayName: 'Filter - Installer Admin Id',
    description: '',
    required: false,
  }),

  filter__createdAfter: Property.DateTime({
    displayName: 'Filter - Created After',
    description: 'Lists the installer jobs that have been created after the specified date and time, please provide the value as an ISO 8601 formatted date',
    required: false,
  }),

  filter__createdBefore: Property.DateTime({
    displayName: 'Filter - Created Before',
    description: 'Lists the installer jobs that have been created before the specified date and time, please provide the value as an ISO 8601 formatted date',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'Lists the installer jobs that have been last updated after the specified date and time, please provide the value as an ISO 8601 formatted date',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'Lists the installer jobs that have been last updated before the specified date and time, please provide the value as an ISO 8601 formatted date',
    required: false,
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
  async run(context): Promise<GetInstallerJobsListResponse> {
    try {
      const url = processPathParameters('/public-api/resources/installer-jobs/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page']);
      
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
      }) as GetInstallerJobsListResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetInstallerJobsListResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
