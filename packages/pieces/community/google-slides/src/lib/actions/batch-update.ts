import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { batchUpdateOutputSchema } from '../output-schemas';

export const batchUpdate = createAction({
  auth: googleSlidesAuth,
  name: 'batch_update',
  classification: 'WRITE',
  displayName: 'Batch Update (Advanced)',
  description: 'Send raw Google Slides batchUpdate requests to a presentation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Advanced escape hatch that sends a raw array of Google Slides API batchUpdate Request objects (createShape, insertText, updateTextStyle, createTable, groupObjects, etc.) to one presentation; all requests apply atomically or none do. Only use it for edits no dedicated Slides action covers (grouping, merged cells, lines, table borders, column widths): prefer Create Shape or Text Box, Insert Text, Set Element Text, Update Text Style, Update Paragraph Style, Create Table, Move or Resize Element, Add Slide, Replace Text and the others, which validate input and return the IDs you need. Get object IDs from Get Presentation Outline; new object IDs must be 5-50 characters of [a-zA-Z0-9_-:]. Optionally pass Required Revision ID to fail if the deck changed. Not idempotent in general.',
    idempotent: false,
  },
  outputSchema: batchUpdateOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    requests: Property.Json({
      displayName: 'Requests',
      description:
        'JSON array of Slides API Request objects, e.g. [{"createShape":{"objectId":"box_001","shapeType":"TEXT_BOX","elementProperties":{"pageObjectId":"p"}}}].',
      required: true,
    }),
    required_revision_id: Property.ShortText({
      displayName: 'Required Revision ID',
      description: 'Optional revisionId (from Get Presentation Outline); the update fails if the presentation changed since.',
      required: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const requests = slidesRequests.readBatchRequests(context.propsValue.requests);
    const accessToken = await getAccessToken(context.auth);
    const response = await slidesApi
      .batchUpdate({
        accessToken,
        presentationId,
        requests,
        requiredRevisionId: context.propsValue.required_revision_id?.trim() || undefined,
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'apply the batch update' });
      });
    return {
      presentationId: response.presentationId ?? presentationId,
      appliedRequests: requests.length,
      replies: response.replies ?? [],
      writeControl: response.writeControl ?? null,
    };
  },
});
