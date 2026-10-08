import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const urlInspection = createAction({
  auth: googleSearchConsoleAuth,
  name: 'urlInspection',
  classification: 'READ',
  displayName: 'URL Inspection',
  description: "Use the URL Inspection action to check the status and presence of a specific page within Google's index.",
  audience: 'human',
  aiMetadata: {
    description:
      "Reports Google's index status of one URL in a property picked from a list. Agents use Inspect URL (by Site URL). Read-only and safe to retry; limited to 2,000 inspections per property per day.",
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    url: Property.ShortText({
      displayName: 'URL to Inspect',
      description: 'The full URL of the page. It must belong to the selected property.',
      required: true,
    }),
    languageCode: Property.ShortText({
      displayName: 'Language Code',
      description: 'Optional language for the issue messages, as a BCP-47 code such as "en-US" or "de". Defaults to English.',
      required: false,
    }),
  },
  outputSchema: gscOutputSchemas.urlInspection,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    const inspectionUrl = gscInputs.urlInProperty({ value: context.propsValue.url, label: 'URL to Inspect', site: siteUrl });
    const languageCode = gscInputs.languageCode({ value: context.propsValue.languageCode });
    return gscOps.inspectUrl({ auth: context.auth, siteUrl, inspectionUrl, languageCode });
  },
});
