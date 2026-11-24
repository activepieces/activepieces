import { createAction, Property } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { firstTouchClient } from '../common/client';
import { linkedinUtils } from '../common/linkedin';
import { firstTouchProps } from '../common/props';
import { readUtils } from '../common/read';

export const checkConnectionStatusAction = createAction({
  auth: firstTouchAuth,
  name: 'check_connection_status',
  classification: 'SEARCH',
  displayName: 'Check Connection Status',
  description: 'Check whether anyone on your team is connected to a contact on LinkedIn.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up which FirstTouch teammates are already connected to one person on LinkedIn, by their linkedin.com/in/ profile URL, using saved FirstTouch connection data. Use it before Send Connection Request or Send Message to pick the right step. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: "The contact's LinkedIn profile URL, e.g. https://www.linkedin.com/in/jane-doe.",
      required: true,
    }),
    teammate: firstTouchProps.teammateDropdown({
      displayName: 'Teammate',
      description: 'Only check this teammate. Leave empty to check everyone on your team.',
    }),
  },
  async run(context) {
    const linkedinUrl = linkedinUtils.profileUrl(context.propsValue.linkedin_url);
    const response = await firstTouchClient.callTool({
      apiKey: context.auth.secret_text,
      tool: 'list_linkedin_team_connections',
      body: {
        mode: 'team_members_connected_to_person',
        connectedPersonLinkedInUrl: linkedinUrl,
        ownerUserId: linkedinUtils.emptyToUndefined(context.propsValue.teammate),
        limit: 100,
      },
    });
    const rows = readUtils.records(readUtils.record(response['connections'])['items']);
    const owners = rows.map((row) => readUtils.record(row['owner']));
    const first = rows.length > 0 ? readUtils.record(rows[0]['connection']) : {};
    return {
      linkedin_url: linkedinUrl,
      is_connected: rows.length > 0,
      connected_teammate_count: rows.length,
      connected_teammates: owners.map((owner) => readUtils.text(owner['name'])).filter(Boolean).join(', '),
      connected_teammate_emails: owners.map((owner) => readUtils.text(owner['email'])).filter(Boolean).join(', '),
      first_connected_teammate_user_id: owners.length > 0 ? readUtils.text(owners[0]['userId']) : null,
      connected_at: readUtils.text(first['connectedAtUtc']),
      full_name: readUtils.text(first['fullName']),
      headline: readUtils.text(first['headline']),
    };
  },
});
