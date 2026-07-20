import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  QueryParams,
  propsValidation,
} from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { omnihrAuth } from '../auth';

const REPORT_TYPE_SNAPSHOT = 2;

export const generateReport = createAction({
  auth: omnihrAuth,
  name: 'generateReport',
  displayName: 'Generate Report',
  description:
    'Generate Custom Report. For Snapshot report templates, optionally generate the report as of a past date',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates the data for an existing OmniHR custom report template and returns the rows as an array of objects. The fields present on each row depend on the columns configured in the selected template. For Snapshot report templates, an optional as-of date (DD/MM/YYYY, must not be in the future) can be provided to generate the report using data as of that date; if omitted, the latest data is used. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    reportTemplateId: Property.Dropdown({
      auth: omnihrAuth,
      displayName: 'Report Template',
      description: 'The custom report template to generate a report from',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const headers = {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Origin: auth.props.origin,
        };

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.omnihr.co/api/v1/reports/custom/templates',
          headers,
        });

        const templates: Array<{ id: number; name: string }> = response.body;

        return {
          disabled: false,
          options: templates.map((template) => ({
            label: template.name,
            value: template.id,
          })),
        };
      },
    }),
    snapshotOptions: Property.DynamicProperties({
      auth: omnihrAuth,
      displayName: 'Snapshot Options',
      required: false,
      refreshers: ['auth', 'reportTemplateId'],
      props: async ({ auth, reportTemplateId }): Promise<InputPropertyMap> => {
        if (!auth || !reportTemplateId) {
          return {};
        }

        const headers = {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Origin: auth.props.origin,
        };

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.omnihr.co/api/v1/reports/custom/templates/${reportTemplateId}/`,
          headers,
        });

        const template: { report_type: number } = response.body;

        if (template.report_type !== REPORT_TYPE_SNAPSHOT) {
          return {};
        }

        return {
          asOfDate: Property.ShortText({
            displayName: 'As of Date',
            description:
              'Optional. Generate the report using data as of this date (DD/MM/YYYY). Defaults to the latest data if omitted. Must not be a future date.',
            required: false,
          }),
        };
      },
    }),
  },
  async run(context) {
    const { reportTemplateId, snapshotOptions } = context.propsValue;
    const asOfDate: string | undefined = snapshotOptions?.['asOfDate'];

    const headers = {
      Authorization: `Bearer ${context.auth.access_token}`,
      'Content-Type': 'application/json',
      Origin: context.auth.props.origin,
    };

    const queryParams: QueryParams = {};

    if (asOfDate) {
      await propsValidation.validateZod(
        { asOfDate },
        {
          asOfDate: z.pipe(
            z.string(),
            z.transform((val) => {
              const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
              if (!match) {
                throw new Error('As of Date must be in DD/MM/YYYY format');
              }

              const [, day, month, year] = match;
              const date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
              );
              const isValidCalendarDate =
                date.getFullYear() === Number(year) &&
                date.getMonth() === Number(month) - 1 &&
                date.getDate() === Number(day);
              if (!isValidCalendarDate) {
                throw new Error(
                  'As of Date must be a valid date in DD/MM/YYYY format'
                );
              }

              if (date.getTime() > Date.now()) {
                throw new Error('As of Date must not be in the future');
              }

              return val;
            })
          ),
        }
      );

      queryParams['as_of_date'] = asOfDate;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.omnihr.co/api/v1/reports/custom/templates/${reportTemplateId}/generate-json`,
      headers,
      queryParams,
    });

    return response.body;
  },
});
