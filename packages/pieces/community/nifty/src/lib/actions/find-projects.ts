import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyClient } from '../common/client';
import { findProjectsOutputSchema } from '../output-schemas';

export const findProjects = createAction({
  auth: niftyAuth,
  name: 'find_projects',
  displayName: 'Find Projects',
  description: 'Find projects by name, optionally in one portfolio.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Nifty projects you can see, optionally only those whose name contains a text (case-insensitive), in one portfolio, or archived ones too. Leave the name empty to list them all. Use to get the project_id that task, status and milestone actions need. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    name_contains: Property.ShortText({ displayName: 'Name Contains', required: false }),
    portfolio_id: Property.ShortText({ displayName: 'Portfolio ID', required: false }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
  },
  outputSchema: findProjectsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const portfolioId = niftyClient.optionalId({ value: p.portfolio_id, label: 'Portfolio ID' });
    const needle = typeof p.name_contains === 'string' ? p.name_contains.trim().toLowerCase() : '';
    const active = await niftyClient.listAll({
      auth: context.auth,
      path: 'projects',
      key: 'projects',
      query: { subteam_id: portfolioId },
    });
    const archived =
      p.include_archived === true
        ? await niftyClient.listAll({
            auth: context.auth,
            path: 'projects',
            key: 'projects',
            query: { subteam_id: portfolioId, archived: true },
          })
        : { items: [], truncated: false };
    const matches = [...active.items, ...archived.items]
      .filter((project) => portfolioId === undefined || niftyClient.text({ record: project, key: 'subteam' }) === portfolioId)
      .filter((project) => needle.length === 0 || niftyClient.text({ record: project, key: 'name' }).toLowerCase().includes(needle))
      .map(niftyClient.cleanProject);
    return { items: matches, truncated: active.truncated || archived.truncated };
  },
});
