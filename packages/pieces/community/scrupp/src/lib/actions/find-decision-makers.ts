import { createAction, Property } from '@activepieces/pieces-framework';
import { scruppAuth } from '../auth';
import { runScruppJob } from '../common';
import { timeoutProp } from '../common/props';

export const findDecisionMakersAction = createAction({
  auth: scruppAuth,
  name: 'find-decision-makers',
  displayName: 'Find Decision Makers',
  description: 'Find the decision makers at a company by domain, company name or company LinkedIn URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Finds decision makers at a company. Identify the company by domain (openai.com), by name, or by its LinkedIn company URL, and set "Find By" to match. Returns one item per person with name, title and, where available, email. Costs one credit per record returned; empty results are refunded.',
    idempotent: true,
  },
  props: {
    findBy: Property.StaticDropdown({
      displayName: 'Find By',
      required: true,
      defaultValue: 'contact.decision_maker.domain',
      options: {
        options: [
          { label: 'Company domain', value: 'contact.decision_maker.domain' },
          { label: 'Company name', value: 'contact.decision_maker.name' },
          { label: 'Company LinkedIn URL', value: 'contact.decision_maker.linkedin' },
        ],
      },
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The domain, name or LinkedIn URL, matching the option above.',
      required: true,
    }),
    max: Property.Number({
      displayName: 'Decision Makers per Company',
      required: false,
      defaultValue: 10,
    }),
    timeoutSeconds: timeoutProp,
  },
  async run(context) {
    const { findBy, company, max, timeoutSeconds } = context.propsValue;

    return runScruppJob({
      auth: context.auth,
      type: findBy,
      input: { items: [company], max: max ?? 10 },
      idempotencyKey: `ap-${context.run.id}-decision-makers`,
      timeoutSeconds: timeoutSeconds ?? 900,
    });
  },
});
