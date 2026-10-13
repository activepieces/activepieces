import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomProps } from '../common/props';
import { fathomSdk } from '../common/sdk';
import { fathomOutputSchemas } from '../output-schemas';

export const getRecordingSummary = createAction({
  name: 'getRecordingSummary',
  classification: 'READ',
  displayName: 'Get Recording Summary',
  description: 'Get the AI-generated summary of a meeting recording. Works with both OAuth and API key connections.',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves the AI summary (markdown) of one Fathom recording picked from a list of recent meetings, or asks Fathom to POST it to a destination URL instead. Agents should use Get Recording Summary (AI), which takes a recording ID. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    recording_id: fathomProps.recordingDropdown({ description: 'Select the meeting recording to get the summary for' }),
    destination_url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'Optional: URL where Fathom will POST the summary. Leave empty to get data directly in response.',
      required: false,
    }),
  },
  outputSchema: fathomOutputSchemas.legacySummary,
  async run({ auth, propsValue }) {
    const { sdk, requireResult } = fathomSdk.create({ auth });
    const destinationUrl = propsValue.destination_url?.trim();
    const response = await sdk.getRecordingSummary({
      recordingId: propsValue.recording_id,
      ...(destinationUrl ? { destinationUrl } : {}),
    });
    return requireResult({ value: response, operation: 'Get Recording Summary' });
  },
});
