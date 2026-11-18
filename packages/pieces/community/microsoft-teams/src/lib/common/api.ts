import type { Client } from '@microsoft/microsoft-graph-client';

import type { MicrosoftTeamsPage } from './types';

async function resolveMeetingId({
  client,
  identifierType,
  identifierValue,
}: {
  client: Client;
  identifierType: string;
  identifierValue: string;
}): Promise<string> {
  if (identifierType === 'meetingId') return identifierValue;
  const filter =
    identifierType === 'joinWebUrl'
      ? `JoinWebUrl eq '${identifierValue}'`
      : `joinMeetingIdSettings/joinMeetingId eq '${identifierValue}'`;
  const response: MicrosoftTeamsPage<{ id: string }> = await client
    .api('/me/onlineMeetings')
    .filter(filter)
    .get();
  if (!response.value?.length) {
    throw new Error('No meeting found with the provided identifier.');
  }
  return response.value[0].id;
}

export const microsoftTeamsApi = { resolveMeetingId };
