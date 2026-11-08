import { createAction, Property } from '@activepieces/pieces-framework';
import type { DocumentSetVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointCreateDocumentSetVersionOutputSchema } from '../../../output-schemas';

export const createDocumentSetVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_document_set_version',
  outputSchema: microsoftSharepointCreateDocumentSetVersionOutputSchema,
  displayName: 'Create Document Set Version',
  description: 'Captures a new version of a document set.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Captures the current state of a document set and its items as a new version that Restore Document Set Version can return to. Each call adds another version. Works only on a document set item in a library with the Document Sets feature enabled; List List Items returns the item ID.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({
      required: true,
      displayName: 'Document Set Item ID',
      description:
        'List item ID of the document set, a number like "12" sent as text. Use List List Items to find it.',
    }),
    comment: Property.ShortText({
      displayName: 'Comment',
      description: 'Comment about the captured version.',
      required: false,
    }),
    shouldCaptureMinorVersion: Property.StaticDropdown({
      displayName: 'Capture Minor Versions',
      description:
        '"true" also captures minor versions of the items; "false" captures only major versions. Microsoft Graph defaults to "false".',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const shouldCaptureMinorVersion = microsoftSharePointUtils.booleanChoice({
      value: propsValue.shouldCaptureMinorVersion,
      propName: 'Capture Minor Versions',
    });
    const version: DocumentSetVersion = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/documentSetVersions`
      )
      .post({
        ...(propsValue.comment !== undefined ? { comment: propsValue.comment } : {}),
        ...(shouldCaptureMinorVersion !== undefined ? { shouldCaptureMinorVersion } : {}),
      });
    return version;
  },
});
