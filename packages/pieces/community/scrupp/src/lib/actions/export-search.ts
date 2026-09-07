import { createAction, Property } from '@activepieces/pieces-framework';
import { scruppAuth } from '../auth';
import { runScruppJob } from '../common';
import { maxRecordsProp, timeoutProp, withEmailsProp } from '../common/props';

export const exportSearchAction = createAction({
  auth: scruppAuth,
  name: 'export-search',
  displayName: 'Export Search',
  description:
    'Turn a Sales Navigator, LinkedIn or Apollo search URL into the people behind it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Exports the people matching a saved search. Build the filters in Sales Navigator, LinkedIn or Apollo, copy the search URL, and pass it here; the action returns one item per person, optionally with email addresses. Apollo searches and personal Sales Navigator searches need a connected account email. Costs one credit per record returned.',
    idempotent: true,
  },
  props: {
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      required: true,
      defaultValue: 'sales_navigator.search',
      options: {
        options: [
          { label: 'Sales Navigator', value: 'sales_navigator.search' },
          { label: 'LinkedIn', value: 'linkedin.search' },
          { label: 'Apollo', value: 'apollo.search' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Search URL',
      description: 'Build the filters in the platform, then paste the URL of the results page.',
      required: true,
    }),
    withEmails: withEmailsProp,
    max: maxRecordsProp,
    account: Property.ShortText({
      displayName: 'Account Email',
      description:
        'Connected account to run with. Required for Apollo, and for Sales Navigator searches that use personal or saved filters.',
      required: false,
    }),
    timeoutSeconds: timeoutProp,
  },
  async run(context) {
    const { platform, url, withEmails, max, account, timeoutSeconds } = context.propsValue;

    const input: Record<string, unknown> = {
      url,
      with_emails: withEmails ?? true,
      max: max ?? 100,
    };

    if (account) {
      input['account'] = account;
    }

    return runScruppJob({
      auth: context.auth,
      type: platform,
      input,
      idempotencyKey: `ap-${context.run.id}-export-search`,
      timeoutSeconds: timeoutSeconds ?? 900,
    });
  },
});
