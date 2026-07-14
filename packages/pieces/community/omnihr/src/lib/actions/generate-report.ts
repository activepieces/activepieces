import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { omnihrAuth } from '../auth';
import { getAuthHeaders, OmniHrAuth } from '../common/client';

const OMNIHR_REPORT_TEMPLATES_URL =
  'https://api.omnihr.co/api/v1/reports/custom/templates/';

async function fetchReportTemplates(
  auth: OmniHrAuth
): Promise<ReportTemplate[]> {
  const headers = await getAuthHeaders(auth);
  const response = await httpClient.sendRequest<ReportTemplate[]>({
    method: HttpMethod.GET,
    url: OMNIHR_REPORT_TEMPLATES_URL,
    headers,
  });

  return response.body;
}

export const generateReport = createAction({
  auth: omnihrAuth,
  name: 'generate_report',
  displayName: 'Generate Report',
  description:
    'Users would set up a Custom Report and we can retrieve them on activepieces',
  audience: 'both',
  aiMetadata: {
    description: 'export data from OmniHR through Custom Reports',
    idempotent: true,
  },
  props: {
    mapping_report: Property.Dropdown({
      displayName: 'Select an Option',
      description: 'Choose an report from the dropdown',
      required: true,
      auth: omnihrAuth,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const templates = await fetchReportTemplates(auth);

        return {
          options: templates.map((template) => ({
            label: template.name,
            value: `${template.id}`,
          })),
        };
      },
    }),
    reportOptions: Property.DynamicProperties({
      displayName: 'Report Options',
      description: 'Additional options required by the selected report',
      required: false,
      auth: omnihrAuth,
      refreshers: ['mapping_report'],
      props: async ({ auth, mapping_report }): Promise<DynamicPropsValue> => {
        if (!auth || !mapping_report) {
          return {};
        }

        const templates = await fetchReportTemplates(auth as OmniHrAuth);
        const selectedReport = templates.find(
          (template) => `${template.id}` === mapping_report
        );

        if (selectedReport?.report_type !== 'Snapshot') {
          return {};
        }

        return {
          asOfDate: Property.ShortText({
            displayName: 'Snapshot Date',
            description:
              'The date to generate this snapshot report as of, e.g. 01/15/2026 (MM/DD/YYYY)',
            required: true,
          }),
        };
      },
    }),
    mapFieldNames: Property.Checkbox({
      displayName: 'Map Field Names',
      description:
        'Whether the response returns objects keyed by field id or name',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { mapping_report, reportOptions, mapFieldNames } = context.propsValue;
    const auth = context.auth as OmniHrAuth;
    const headers = await getAuthHeaders(auth);

    const asOfDate =
      typeof reportOptions?.['asOfDate'] === 'string'
        ? reportOptions['asOfDate']
        : undefined;

    await propsValidation.validateZod(
      { asOfDate },
      { asOfDate: z.optional(z.string().check(z.regex(/^\d{2}\/\d{2}\/\d{4}$/))) }
    );

    const queryParams: Record<string, string> = {};
    if (asOfDate) {
      queryParams['as_of_date'] = asOfDate;
    }

    const reportResponse = await httpClient.sendRequest<{
      data: Record<string, unknown>[];
      fields?: { id: string; name: string }[];
    }>({
      method: HttpMethod.GET,
      url: `https://api.omnihr.co/api/v1/reports/custom/templates/${mapping_report}/generate-json`,
      headers,
      queryParams,
    });

    if (!mapFieldNames) {
      return reportResponse.body.data;
    }

    const idToName = new Map(
      (reportResponse.body.fields ?? []).map((field) => [field.id, field.name])
    );

    return reportResponse.body.data.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([fieldId, value]) => [
          idToName.get(fieldId) ?? fieldId,
          value,
        ])
      )
    );
  },
});

type ReportTemplate = {
  id: number;
  name: string;
  report_type: 'Master' | 'Snapshot';
};
