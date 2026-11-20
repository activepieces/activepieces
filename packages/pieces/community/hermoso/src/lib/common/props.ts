import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownState, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from './client';

const brand = Property.Dropdown<string, false, typeof hermosoAuth>({
  auth: hermosoAuth,
  displayName: 'Brand',
  description: 'The Hermoso brand workspace to use. Leave empty to use the brand your API key is set to.',
  required: false,
  refreshers: [],
  options: async ({ auth }): Promise<DropdownState<string>> => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Hermoso account first' };
    }
    const rows = await listRows({ apiKey: auth.secret_text, path: '/brands' });
    return {
      disabled: false,
      options: rows
        .filter((row) => hermosoApi.text(row['id']).length > 0)
        .map((row) => ({
          label: `${hermosoApi.text(row['name']) || hermosoApi.text(row['id'])}${row['shared'] === true ? ' (shared with you)' : ''}`,
          value: hermosoApi.brandValue(row),
        })),
    };
  },
});

function modelDropdown({ type }: { type: 'image' | 'video' }) {
  return Property.Dropdown<string, false, typeof hermosoAuth>({
    auth: hermosoAuth,
    displayName: 'Model',
    description: 'Leave empty and Hermoso picks the model.',
    required: false,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Hermoso account first' };
      }
      const rows = await listRows({ apiKey: auth.secret_text, path: '/models', queryParams: { type } });
      return {
        disabled: false,
        options: rows
          .filter((row) => hermosoApi.text(row['id']).length > 0)
          .map((row) => ({
            label: `${hermosoApi.text(row['label']) || hermosoApi.text(row['id'])}${row['featured'] === true ? ' (recommended)' : ''}`,
            value: hermosoApi.text(row['id']),
          })),
      };
    },
  });
}

const channels = Property.MultiSelectDropdown<string, true, typeof hermosoAuth>({
  auth: hermosoAuth,
  displayName: 'Channels',
  description:
    'Where the post goes. The list shows the channels connected to the brand in Hermoso. Each channel publishes on its own, so one failing does not stop the others.',
  required: true,
  refreshers: ['brand'],
  options: async ({ auth, brand }): Promise<DropdownState<string>> => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Hermoso account first' };
    }
    const rows = await listRows({
      apiKey: auth.secret_text,
      path: '/channels',
      brand: typeof brand === 'string' ? brand : undefined,
    });
    const connected = rows.filter((row) => row['connected'] === true && row['available'] !== false);
    if (connected.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No channel is connected to this brand yet. Connect one in Hermoso under Connectors.',
      };
    }
    return {
      disabled: false,
      options: connected.map((row) => {
        const name = hermosoApi.text(row['name']) || hermosoApi.text(row['id']);
        const account = hermosoApi.text(row['account']);
        return { label: account ? `${name} (${account})` : name, value: hermosoApi.text(row['id']) };
      }),
    };
  },
});

const jobId = Property.Dropdown<string, true, typeof hermosoAuth>({
  auth: hermosoAuth,
  displayName: 'Render Job',
  description: 'Pick a recent render, or map the Job ID from a Generate Image or Generate Video step.',
  required: true,
  refreshers: ['brand'],
  options: async ({ auth, brand }): Promise<DropdownState<string>> => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Hermoso account first' };
    }
    const rows = await listRows({
      apiKey: auth.secret_text,
      path: '/jobs',
      brand: typeof brand === 'string' ? brand : undefined,
      queryParams: { limit: '50' },
    });
    return {
      disabled: false,
      options: rows.map((row) => {
        const id = hermosoApi.text(row['id']);
        const label = hermosoApi.text(row['label']) || hermosoApi.text(row['type']) || 'Render';
        return { label: `${label} (${hermosoApi.text(row['status'])}) ${id}`, value: id };
      }),
    };
  },
});

const waitForResult = Property.Checkbox({
  displayName: 'Wait for the Result',
  description:
    'On: the flow waits until the render is finished and this step returns the file. Off: this step returns the queued job at once; use Get Render Job later to collect the file.',
  required: false,
  defaultValue: true,
});

async function listRows({
  apiKey,
  path,
  brand,
  queryParams,
}: {
  apiKey: string;
  path: string;
  brand?: string;
  queryParams?: Record<string, string>;
}): Promise<Record<string, unknown>[]> {
  const response = await hermosoApi.send<unknown>({
    apiKey,
    brand,
    method: HttpMethod.GET,
    path,
    queryParams,
  });
  const data = hermosoApi.isRecord(response.body) ? response.body['data'] : undefined;
  return Array.isArray(data) ? data.filter(hermosoApi.isRecord) : [];
}

export const hermosoProps = {
  brand,
  imageModel: modelDropdown({ type: 'image' }),
  videoModel: modelDropdown({ type: 'video' }),
  channels,
  jobId,
  waitForResult,
};
