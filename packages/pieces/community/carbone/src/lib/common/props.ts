import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneAuth } from '../auth';
import {
  CarboneListResponse,
  CarboneTemplate,
  carboneClient,
} from './client';

const DROPDOWN_PAGE_SIZE = 100;
const DROPDOWN_MAX_PAGES = 5;

export const carboneProps = {
  templateDropdown,
  convertTo: convertToProp,
  lang: langProp,
  converter: converterProp,
  timezone: timezoneProp,
  reportName: reportNameProp,
  readTags,
};

function templateDropdown({
  displayName,
  description,
  showIdInLabel = true,
}: {
  displayName: string;
  description: string;
  showIdInLabel?: boolean;
}) {
  return Property.Dropdown({
    auth: carboneAuth,
    displayName,
    required: true,
    description,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      try {
        const search = searchValue?.trim();
        const { templates, truncated } = await fetchTemplatePages({
          apiKey: auth.secret_text,
          search: search && search.length > 0 ? search : undefined,
        });
        return {
          disabled: false,
          placeholder: truncated
            ? `Showing the first ${templates.length} templates. Type to search by name or ID.`
            : undefined,
          options: templates
            .map((template) => ({ template, id: template.id ?? template.versionId }))
            .filter(({ id }) => typeof id === 'string' && id.length > 0)
            .map(({ template, id }) => ({
              label: showIdInLabel ? `${template.name || id} (${id})` : template.name || id,
              value: id,
            })),
        };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return {
          disabled: true,
          placeholder: `Could not load templates, refresh to retry. ${reason}`,
          options: [],
        };
      }
    },
  });
}

async function fetchTemplatePages({
  apiKey,
  search,
}: {
  apiKey: string;
  search: string | undefined;
}): Promise<{ templates: CarboneTemplate[]; truncated: boolean }> {
  const pages: CarboneTemplate[][] = [];
  let cursor: string | undefined;
  for (let page = 0; page < DROPDOWN_MAX_PAGES; page++) {
    const queryParams: Record<string, string> = { limit: String(DROPDOWN_PAGE_SIZE) };
    if (cursor) queryParams['cursor'] = cursor;
    if (search) queryParams['search'] = search;
    const response = await carboneClient.request<CarboneListResponse<CarboneTemplate>>({
      apiKey,
      method: HttpMethod.GET,
      path: '/templates',
      operation: 'list templates',
      queryParams,
    });
    pages.push(response.body.data ?? []);
    if (!response.body.hasMore || !response.body.nextCursor) {
      return { templates: pages.flat(), truncated: false };
    }
    cursor = response.body.nextCursor;
  }
  return { templates: pages.flat(), truncated: true };
}

function readTags(tags: unknown[] | undefined): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }
  return tags
    .map((entry) => {
      const value = carboneClient.isRecord(entry) ? entry['tag'] : entry;
      if (typeof value === 'string') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      return '';
    })
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function convertToProp() {
  return Property.ShortText({
    displayName: 'Convert To (optional)',
    required: false,
    description: 'Output format, or a JSON object with formatName and formatOptions.',
    placeholder: 'pdf or {"formatName":"pdf","formatOptions":{"Watermark":"Draft"}}',
  });
}

function langProp() {
  return Property.ShortText({
    displayName: 'Language (optional)',
    required: false,
    description: 'Locale for number and date formatting. Defaults to `en-us`.',
    placeholder: 'en-us',
  });
}

function converterProp() {
  return Property.StaticDropdown({
    displayName: 'PDF Converter (optional)',
    required: false,
    description: 'Conversion engine Carbone uses for the output. Defaults to LibreOffice.',
    options: {
      options: [
        { label: 'LibreOffice (L) - Default', value: 'L' },
        { label: 'OnlyOffice (O) - Office docs', value: 'O' },
        { label: 'Chromium (C) - HTML-to-PDF', value: 'C' },
      ],
    },
  });
}

function timezoneProp() {
  return Property.ShortText({
    displayName: 'Timezone (optional)',
    required: false,
    description: 'Timezone for date formatting. Defaults to UTC.',
    placeholder: 'Europe/Paris',
  });
}

function reportNameProp() {
  return Property.ShortText({
    displayName: 'Report Name (optional)',
    required: false,
    description: 'Filename for the generated document; may use template tags.',
    placeholder: 'invoice-{d.number}',
  });
}
