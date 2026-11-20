import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const urlInspection = createAction({
  auth: googleSearchConsoleAuth,
  name: 'urlInspection',
  classification: 'READ',
  displayName: 'Inspect URL',
  description: 'Checks whether Google has indexed a page, and why.',
  audience: 'human',
  aiMetadata: {
    description:
      "Reports Google's index status of one URL in a property picked from a list. Agents use Inspect URL (by Site URL). Read-only and safe to retry; limited to 2,000 inspections per property per day.",
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    url: Property.ShortText({
      displayName: 'Page URL',
      description: 'The full page URL. It must belong to the selected site.',
      placeholder: 'https://www.example.com/page',
      required: true,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Language of the issue messages. Default: English.',
      placeholder: 'en-US',
      required: false,
      advanced: true,
    }),
    info: Property.MarkDown({
      value: 'Google allows 2,000 inspections per site per day.',
      variant: MarkdownVariant.INFO,
    }),
  },
  propertyGroups: [
    {
      key: 'page',
      display: 'section',
      label: 'Page',
      icon: 'file',
      props: ['siteUrl', 'url', 'info'],
    },
  ],
  outputSchema: gscOutputSchemas.urlInspection,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    const inspectionUrl = gscInputs.urlInProperty({ value: context.propsValue.url, label: 'Page URL', site: siteUrl });
    const languageCode = gscInputs.languageCode({ value: context.propsValue.languageCode });
    return gscOps.inspectUrl({ auth: context.auth, siteUrl, inspectionUrl, languageCode });
  },
});
