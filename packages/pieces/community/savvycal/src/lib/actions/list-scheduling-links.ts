import { createAction } from '@activepieces/pieces-framework';
import { savvyCalPaginatedCall, SavvyCalSchedulingLink } from '../common';
import { savvyCalAuth } from '../../';

export const listSchedulingLinksAction = createAction({
  auth: savvyCalAuth,
  name: 'list_scheduling_links',
  displayName: 'List Scheduling Links',
  description: 'Returns all scheduling links configured in your SavvyCal account.',
  props: {},
  async run(context) {
    const links = await savvyCalPaginatedCall<SavvyCalSchedulingLink>({
      token: context.auth.secret_text,
      path: '/links',
    });

    return links.map((link) => ({
      id: link.id,
      name: link.name,
      slug: link.slug,
      url: link.url ?? null,
      active: link.active ?? null,
      duration_minutes: link.duration ?? null,
      created_at: link.created_at,
      updated_at: link.updated_at,
    }));
  },
});
