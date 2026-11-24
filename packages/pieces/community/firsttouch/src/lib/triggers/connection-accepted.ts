import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { firstTouchClient } from '../common/client';
import { firstTouchPolling, PolledEvent } from '../common/polling';
import { firstTouchProps } from '../common/props';
import { readUtils } from '../common/read';

export const connectionAcceptedTrigger = createTrigger({
  auth: firstTouchAuth,
  name: 'connection_accepted',
  classification: 'READ',
  displayName: 'Connection Accepted',
  description: 'Triggers when someone accepts a connection request and is now connected to a teammate on LinkedIn.',
  aiMetadata: {
    description:
      "Fires once for each new LinkedIn connection saved in FirstTouch for the team, or for one teammate if chosen. Each payload is one connected person plus the teammate they connected with. Connections can sync to FirstTouch a few hours after they happen, so events may arrive late but never twice.",
  },
  props: {
    teammate: firstTouchProps.teammateDropdown({
      displayName: 'Teammate',
      description: "Only this teammate's new connections. Leave empty for everyone you can access.",
    }),
  },
  sampleData: {
    connected_at: '2026-11-24T12:49:19Z',
    full_name: 'Jane Doe',
    first_name: 'Jane',
    last_name: 'Doe',
    headline: 'VP Sales at Acme',
    linkedin_url: 'https://www.linkedin.com/in/jane-doe',
    public_identifier: 'jane-doe',
    teammate_user_id: '86632827-b7c3-4533-b2bb-04d6d9bda6cf',
    teammate_name: 'Alex Smith',
    teammate_email: 'alex@example.com',
    linkedin_account_id: 'lin_account_e8ab189f4baa42e6ac38e9830d379c54',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await firstTouchPolling.enable({
      store: context.store,
      isRepublish: context.isRepublish,
      fetchEvents: () => fetchConnections({ apiKey: context.auth.secret_text, ownerUserId: context.propsValue.teammate }),
    });
  },
  async onDisable(context) {
    await firstTouchPolling.disable({ store: context.store });
  },
  async test(context) {
    return firstTouchPolling.test({
      fetchEvents: () => fetchConnections({ apiKey: context.auth.secret_text, ownerUserId: context.propsValue.teammate }),
    });
  },
  async run(context) {
    return firstTouchPolling.poll({
      store: context.store,
      fetchEvents: () => fetchConnections({ apiKey: context.auth.secret_text, ownerUserId: context.propsValue.teammate }),
    });
  },
});

async function fetchConnections({
  apiKey,
  ownerUserId,
}: {
  apiKey: string;
  ownerUserId: string | undefined;
}): Promise<PolledEvent[]> {
  const response = await firstTouchClient.callTool({
    apiKey,
    tool: 'list_linkedin_team_connections',
    body: {
      mode: ownerUserId ? 'connections_of_team_member' : undefined,
      ownerUserId: ownerUserId || undefined,
      connectedFromUtc: firstTouchPolling.daysAgoIso(7),
      limit: 100,
    },
  });
  return readUtils.records(readUtils.record(response['connections'])['items']).map((row) => {
    const connection = readUtils.record(row['connection']);
    const owner = readUtils.record(row['owner']);
    const account = readUtils.record(row['linkedinAccount']);
    const connectedAt = readUtils.text(connection['connectedAtUtc']) ?? '';
    const personKey = readUtils.text(connection['memberId']) ?? readUtils.text(connection['publicIdentifier']);
    return {
      id: `${readUtils.text(account['linAccountId'])}:${personKey}`,
      occurredAt: connectedAt,
      data: {
        connected_at: connectedAt,
        full_name: readUtils.text(connection['fullName']),
        first_name: readUtils.text(connection['firstName']),
        last_name: readUtils.text(connection['lastName']),
        headline: readUtils.text(connection['headline']),
        linkedin_url: readUtils.text(connection['publicProfileUrl']),
        public_identifier: readUtils.text(connection['publicIdentifier']),
        teammate_user_id: readUtils.text(owner['userId']),
        teammate_name: readUtils.text(owner['name']),
        teammate_email: readUtils.text(owner['email']),
        linkedin_account_id: readUtils.text(account['linAccountId']),
      },
    };
  });
}
