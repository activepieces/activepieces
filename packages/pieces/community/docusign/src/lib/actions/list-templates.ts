import { createAction, Property } from '@activepieces/pieces-framework';
import { docusignAuth } from '../auth';
import { createApiClient } from '../common';
import {
  EnvelopeTemplate,
  EnvelopeTemplateResults,
  TemplatesApi,
} from 'docusign-esign';

export const listTemplates = createAction({
  name: 'listTemplates',
  displayName: 'Find Templates by Name',
  description: 'Search for reusable signing templates by name.',
  auth: docusignAuth,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'Full or partial name of the template to search for.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth);
    const templatesApiClient = new TemplatesApi(apiClient);

    const getPage = async (startPosition: number) => {
      return await templatesApiClient.listTemplates(propsValue.accountId, {
        count: '100',
        startPosition: startPosition.toString(),
        searchText: propsValue.templateName,
      });
    };

    let startPosition = 0;
    const templates: EnvelopeTemplate[] = [];
    let page: EnvelopeTemplateResults | null = null;

    do {
      page = await getPage(startPosition);
      if (page.envelopeTemplates) {
        templates.push(...page.envelopeTemplates);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      startPosition = parseInt(page.endPosition!) + 1;
    } while (
      page.endPosition &&
      page.totalSetSize &&
      parseInt(page.endPosition) + 1 < parseInt(page.totalSetSize)
    );

    return templates;
  },
});
