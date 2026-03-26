import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { tagDropdown } from '../../common/props';

export const addTagAction = createAction({
  name: 'add_tag',
  displayName: 'Add Tag',
  description: 'Adds a tag to a lead.',
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
    return await client.callAction('leads/add-tag', {
      leadId: context.propsValue.leadId,
      tag: context.propsValue.tag,
    });
  },
});
