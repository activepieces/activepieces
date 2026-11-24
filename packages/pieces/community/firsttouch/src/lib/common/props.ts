import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { firstTouchClient } from './client';
import { readUtils } from './read';

function flowDropdown({ description }: { description: string }) {
  return Property.Dropdown<string, true, typeof firstTouchAuth>({
    auth: firstTouchAuth,
    displayName: 'Flow',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your FirstTouch account first.' };
      }
      try {
        const options = await listFlowOptions({ apiKey: auth.secret_text });
        return { disabled: false, options, placeholder: options.length === 0 ? 'No flows found.' : undefined };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load flows. Check the connection.' };
      }
    },
  });
}

function teammateDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.Dropdown<string, false, typeof firstTouchAuth>({
    auth: firstTouchAuth,
    displayName,
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your FirstTouch account first.' };
      }
      try {
        const response = await firstTouchClient.callTool({ apiKey: auth.secret_text, tool: 'list_team_members' });
        const options = readUtils.records(response['items']).map((member) => ({
          label: `${readUtils.text(member['name']) ?? readUtils.text(member['email'])} (${readUtils.text(member['email'])})`,
          value: readUtils.text(member['userId']) ?? '',
        }));
        return { disabled: false, options };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load teammates. Check the connection.' };
      }
    },
  });
}

function linkedinAccountDropdown({ description }: { description: string }) {
  return Property.Dropdown<string, false, typeof firstTouchAuth>({
    auth: firstTouchAuth,
    displayName: 'LinkedIn Account',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your FirstTouch account first.' };
      }
      try {
        const response = await firstTouchClient.callTool({
          apiKey: auth.secret_text,
          tool: 'list_team_members',
          body: { isLinkedinConnected: true },
        });
        const options = readUtils
          .records(response['items'])
          .map((member) => ({ member, account: readUtils.record(member['linkedinAccount']) }))
          .filter(({ account }) => readUtils.text(account['id']))
          .map(({ member, account }) => ({
            label: `${readUtils.text(account['fullName']) ?? readUtils.text(member['name'])} (${readUtils.text(member['email'])})`,
            value: readUtils.text(account['id']) ?? '',
          }));
        return { disabled: false, options };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load LinkedIn accounts. Check the connection.' };
      }
    },
  });
}

function signalDropdown({ description }: { description: string }) {
  return Property.Dropdown<string, true, typeof firstTouchAuth>({
    auth: firstTouchAuth,
    displayName: 'Signal',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your FirstTouch account first.' };
      }
      try {
        const response = await firstTouchClient.callTool({
          apiKey: auth.secret_text,
          tool: 'list_social_engagement_signals',
        });
        const options = readUtils.records(response['signals']).map((signal) => ({
          label: readUtils.text(signal['name']) ?? 'Untitled signal',
          value: readUtils.text(signal['id']) ?? '',
        }));
        return { disabled: false, options, placeholder: options.length === 0 ? 'No signals found.' : undefined };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load signals. Check the connection.' };
      }
    },
  });
}

async function listFlowOptions({ apiKey }: { apiKey: string }): Promise<DropdownOption<string>[]> {
  const pages = await fetchFlowPages({ apiKey, cursor: undefined, page: 0 });
  const options = pages.map((flow) => {
    const name = readUtils.text(flow['name']);
    const isDraft = flow['isDraft'] === true;
    const created = (readUtils.text(flow['created']) ?? '').slice(0, 10);
    return {
      label: name ? `${name}${isDraft ? ' [draft]' : ''}` : `(untitled draft, created ${created})`,
      value: readUtils.text(flow['id']) ?? '',
      rank: (name ? 0 : 2) + (isDraft ? 1 : 0),
    };
  });
  return [...options].sort((a, b) => a.rank - b.rank).map(({ label, value }) => ({ label, value }));
}

async function fetchFlowPages({
  apiKey,
  cursor,
  page,
}: {
  apiKey: string;
  cursor: string | undefined;
  page: number;
}): Promise<Record<string, unknown>[]> {
  const response = await firstTouchClient.callTool({
    apiKey,
    tool: 'list_flow_plans',
    body: { limit: 100, cursor, orderBy: 'created', orderDirection: 'descending' },
  });
  const items = readUtils.records(response['items']);
  const next = readUtils.text(response['cursor']);
  if (response['hasMore'] !== true || !next || page >= MAX_FLOW_PAGES - 1) {
    return items;
  }
  return [...items, ...(await fetchFlowPages({ apiKey, cursor: next, page: page + 1 }))];
}

const MAX_FLOW_PAGES = 5;

export const firstTouchProps = { flowDropdown, teammateDropdown, linkedinAccountDropdown, signalDropdown };
