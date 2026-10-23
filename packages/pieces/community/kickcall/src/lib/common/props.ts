import { Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { kickcallClient, KickcallAuth } from './client';
import { kickcallWorksheets } from './worksheets';

export const locationIdDropdown = Property.Dropdown({
  auth: kickcallAuth,
  displayName: 'Location',
  description: 'Kickcall location to use for this action.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => locationOptions(auth),
});

export const agentIdDropdown = Property.Dropdown({
  auth: kickcallAuth,
  displayName: 'Agent',
  description: 'Kickcall agent to use for this action.',
  required: true,
  refreshers: ['auth', 'location_id'],
  options: async ({ auth, location_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Kickcall account first',
      };
    }
    const locationId = propId(location_id);
    if (locationId.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a location first',
      };
    }
    try {
      const payload = await kickcallClient.bearerRequestAllPages({
        auth,
        path: `/api/v1/business/locations/${encodeURIComponent(locationId)}/agents`,
      });
      const options = kickcallClient.namedOptionsFromCollection(payload);
      if (options.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No agents found for this location',
        };
      }
      return {
        disabled: false,
        options,
      };
    } catch (error: unknown) {
      return {
        disabled: true,
        options: [],
        placeholder: dropdownErrorPlaceholder(error),
      };
    }
  },
});

export const worksheetIdDropdown = Property.Dropdown({
  auth: kickcallAuth,
  displayName: 'Worksheet',
  description: 'Kickcall worksheet to read or update.',
  required: true,
  refreshers: ['location_id', 'agent_id'],
  options: async ({ auth, location_id, agent_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Kickcall account first',
      };
    }
    const locationId = propId(location_id);
    const agentId = propId(agent_id);
    if (locationId.length === 0 || agentId.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a location and agent first',
      };
    }
    try {
      const worksheets = await kickcallWorksheets.listWorksheets({
        auth,
        locationId,
        agentId,
      });
      if (worksheets.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No worksheets found for this agent',
        };
      }
      return {
        disabled: false,
        options: worksheets.map((worksheet) => ({
          label: worksheet.name,
          value: worksheet.id,
        })),
      };
    } catch (error: unknown) {
      return {
        disabled: true,
        options: [],
        placeholder: dropdownErrorPlaceholder(error),
      };
    }
  },
});

export const worksheetColumnDropdown = Property.Dropdown({
  auth: kickcallAuth,
  displayName: 'Column',
  description: 'Worksheet column to search.',
  required: true,
  refreshers: ['location_id', 'agent_id', 'worksheet_id'],
  options: async ({ auth, location_id, agent_id, worksheet_id }) =>
    worksheetTextColumnOptions({
      auth,
      location_id,
      agent_id,
      worksheet_id,
      emptyPlaceholder: 'No searchable text columns found',
    }),
});

export const worksheetColumnsToClearProp = Property.MultiSelectDropdown({
  auth: kickcallAuth,
  displayName: 'Columns to Clear',
  description:
    'Optional. Set these columns to empty on the row. Use this to clear cells; leaving Values blank keeps existing data.',
  required: false,
  refreshers: ['location_id', 'agent_id', 'worksheet_id'],
  options: async ({ auth, location_id, agent_id, worksheet_id }) =>
    worksheetTextColumnOptions({
      auth,
      location_id,
      agent_id,
      worksheet_id,
      emptyPlaceholder: 'No clearable text columns found',
    }),
});

export const worksheetRowValuesProp = Property.DynamicProperties({
  auth: kickcallAuth,
  displayName: 'Values',
  description: 'Column values for the worksheet row.',
  required: true,
  refreshers: ['location_id', 'agent_id', 'worksheet_id'],
  props: async ({ auth, location_id, agent_id, worksheet_id }) =>
    worksheetTextColumnFields({
      auth,
      location_id,
      agent_id,
      worksheet_id,
      requireProviderRequiredColumns: true,
    }),
});

export const worksheetRowUpdateValuesProp = Property.DynamicProperties({
  auth: kickcallAuth,
  displayName: 'Values',
  description:
    'Column values to change. Leave fields empty to keep their current values.',
  required: true,
  refreshers: ['location_id', 'agent_id', 'worksheet_id'],
  props: async ({ auth, location_id, agent_id, worksheet_id }) =>
    worksheetTextColumnFields({
      auth,
      location_id,
      agent_id,
      worksheet_id,
      requireProviderRequiredColumns: false,
    }),
});

function dropdownErrorPlaceholder(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return `Error loading options: ${message}`;
}

function propId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

async function locationOptions(auth: KickcallAuth | undefined) {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Connect your Kickcall account first',
    };
  }
  try {
    const payload = await kickcallClient.bearerRequestAllPages({
      auth,
      path: '/api/v1/business/locations',
    });
    const options = kickcallClient.namedOptionsFromCollection(payload);
    if (options.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No locations found for this account',
      };
    }
    return {
      disabled: false,
      options,
    };
  } catch (error: unknown) {
    return {
      disabled: true,
      options: [],
      placeholder: dropdownErrorPlaceholder(error),
    };
  }
}

async function worksheetTextColumnOptions({
  auth,
  location_id,
  agent_id,
  worksheet_id,
  emptyPlaceholder,
}: {
  auth: KickcallAuth | undefined;
  location_id: unknown;
  agent_id: unknown;
  worksheet_id: unknown;
  emptyPlaceholder: string;
}) {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Connect your Kickcall account first',
    };
  }
  const locationId = propId(location_id);
  const agentId = propId(agent_id);
  const worksheetId = propId(worksheet_id);
  if (
    locationId.length === 0 ||
    agentId.length === 0 ||
    worksheetId.length === 0
  ) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Select a worksheet first',
    };
  }
  try {
    const columns = await kickcallWorksheets.listWorksheetColumns({
      auth,
      locationId,
      agentId,
      worksheetId,
    });
    const options = columns
      .filter((column) => !column.hidden && column.dataType === 'text')
      .map((column) => ({
        label: column.name,
        value: column.id,
      }));
    if (options.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: emptyPlaceholder,
      };
    }
    return {
      disabled: false,
      options,
    };
  } catch (error: unknown) {
    return {
      disabled: true,
      options: [],
      placeholder: dropdownErrorPlaceholder(error),
    };
  }
}

async function worksheetTextColumnFields({
  auth,
  location_id,
  agent_id,
  worksheet_id,
  requireProviderRequiredColumns,
}: {
  auth: KickcallAuth | undefined;
  location_id: unknown;
  agent_id: unknown;
  worksheet_id: unknown;
  requireProviderRequiredColumns: boolean;
}): Promise<Record<string, ReturnType<typeof Property.ShortText>>> {
  if (!auth) {
    return {};
  }
  const locationId = propId(location_id);
  const agentId = propId(agent_id);
  const worksheetId = propId(worksheet_id);
  if (
    locationId.length === 0 ||
    agentId.length === 0 ||
    worksheetId.length === 0
  ) {
    return {};
  }
  const columns = await kickcallWorksheets.listWorksheetColumns({
    auth,
    locationId,
    agentId,
    worksheetId,
  });
  const fields: Record<string, ReturnType<typeof Property.ShortText>> = {};
  for (const column of columns) {
    if (column.hidden || column.dataType !== 'text') {
      continue;
    }
    fields[column.id] = Property.ShortText({
      displayName: column.name,
      required: requireProviderRequiredColumns ? column.required : false,
    });
  }
  return fields;
}
