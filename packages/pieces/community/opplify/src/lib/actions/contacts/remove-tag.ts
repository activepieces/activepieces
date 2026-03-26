import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { tagDropdown } from '../../common/props';

export const removeTagAction = createAction({
  name: 'remove_tag',
  displayName: 'Remove Tag',
  description: 'Removes a tag from a lead.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    tag: tagDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/remove-tag', {
      leadId: context.propsValue.leadId,
      tag: context.propsValue.tag,
    });
  },
});
