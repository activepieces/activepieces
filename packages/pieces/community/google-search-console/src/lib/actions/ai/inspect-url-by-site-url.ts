import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscShape } from '../../common/shape';
import { gscOutputSchemas } from '../../output-schemas';

export const inspectUrlBySiteUrl = createAction({
  auth: googleSearchConsoleAuth,
  name: 'inspect_url_by_site_url',
  classification: 'READ',
  displayName: 'Inspect URL (by Site URL)',
  description: "Checks the status of one page in Google's index.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Reports Google's index status of one page in a property: verdict, coverage, last crawl, canonicals, robots.txt and rich result issues. Use it to diagnose why a specific page is or is not indexed. Limited to 2,000 inspections per property per day, so do not loop over a whole site. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
    inspection_url: Property.ShortText({
      displayName: 'URL to Inspect',
      description: 'The full URL of the page. It must belong to the property (same protocol and host, under the property path, or any subdomain of a domain property).',
      required: true,
    }),
    language_code: Property.ShortText({
      displayName: 'Language Code',
      description: 'Optional BCP-47 language for issue messages, e.g. "en-US". Defaults to English.',
      required: false,
    }),
  },
  outputSchema: gscOutputSchemas.inspectUrlAi,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.site_url });
    const inspectionUrl = gscInputs.urlInProperty({ value: context.propsValue.inspection_url, label: 'URL to Inspect', site: siteUrl });
    const languageCode = gscInputs.languageCode({ value: context.propsValue.language_code });
    const body = await gscOps.inspectUrl({ auth: context.auth, siteUrl, inspectionUrl, languageCode });
    return gscShape.inspection({ body, inspectedUrl: inspectionUrl });
  },
});
