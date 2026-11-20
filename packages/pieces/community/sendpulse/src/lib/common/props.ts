import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isRecord, sendpulseApiCall, SendPulseAuthProps } from './client';
import { sendpulseAuth } from './auth';

async function listAllMailingLists({ auth }: { auth: SendPulseAuthProps }): Promise<Record<string, unknown>[]> {
  const collected: Record<string, unknown>[] = [];
  for (let page = 0; page < MAX_LIST_PAGES; page++) {
    const response = await sendpulseApiCall<unknown[]>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/addressbooks',
      query: { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      operation: 'list mailing lists',
    });
    const items = Array.isArray(response) ? response.filter(isRecord) : [];
    collected.push(...items);
    if (items.length < PAGE_SIZE) {
      break;
    }
  }
  return collected;
}

export function readPaging({ limit, offset }: { limit: number | undefined; offset: number | undefined }): { limit: number; offset: number } {
  const safeLimit = limit === undefined || limit === null ? 100 : Math.trunc(limit);
  const safeOffset = offset === undefined || offset === null ? 0 : Math.trunc(offset);
  if (!Number.isFinite(safeLimit) || safeLimit < 1 || safeLimit > 100) {
    throw new Error('Limit must be between 1 and 100.');
  }
  if (!Number.isFinite(safeOffset) || safeOffset < 0) {
    throw new Error('Offset must be 0 or greater.');
  }
  return { limit: safeLimit, offset: safeOffset };
}

const PAGE_SIZE = 100;
const MAX_LIST_PAGES = 20;

export const mailingListDropdown = Property.Dropdown({
  auth: sendpulseAuth,
  displayName: 'Mailing List',
  description: 'Select one of your SendPulse mailing lists, or map a numeric mailing list ID from an earlier step.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your SendPulse account.',
      };
    }

    try {
      const lists = await listAllMailingLists({ auth: auth.props });

      if (!lists.length) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No mailing lists found in your account.',
        };
      }

      return {
        disabled: false,
        options: lists.flatMap((list) => {
          const id = Number(list['id']);
          if (!Number.isFinite(id)) {
            return [];
          }
          const name = typeof list['name'] === 'string' ? list['name'] : String(id);
          const status = typeof list['status_explain'] === 'string' ? ` (${list['status_explain']})` : '';
          return [{ label: `${name}${status}`, value: id }];
        }),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load mailing lists: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
