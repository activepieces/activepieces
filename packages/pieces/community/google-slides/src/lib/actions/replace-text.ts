import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { replaceTextOutputSchema } from '../output-schemas';

export const replaceText = createAction({
  auth: googleSlidesAuth,
  name: 'replace_text',
  classification: 'WRITE',
  displayName: 'Replace Text',
  description: 'Replace every occurrence of a text in the presentation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Replace every occurrence of a text (for example a {{placeholder}}) in the shapes and tables of a Google Slides presentation, optionally only on chosen slides, and report how many were changed. Use it to fill or fix text in an existing deck; to copy a template and fill all its placeholders in one step use Generate from Template. An empty replacement deletes the matched text. Idempotent: a repeat finds nothing left to replace, unless the replacement itself contains the search text.',
    idempotent: true,
  },
  outputSchema: replaceTextOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    find: Property.ShortText({
      displayName: 'Find',
      description: 'Text to search for, e.g. [[customer_name]]. Activepieces reads {{...}} typed into a field as a reference to earlier step data, so search for [[name]]-style tokens or map the text from a previous step.',
      required: true,
    }),
    replace_with: Property.LongText({
      displayName: 'Replace With',
      description: 'Replacement text. Leave empty to delete every match.',
      required: false,
    }),
    match_case: slidesProps.matchCaseProp(),
    slide_object_ids: slidesProps.slideScopeProp(),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const find = context.propsValue.find;
    if (!find) {
      throw new Error('Find is required.');
    }
    const request = slidesRequests.buildReplaceTextRequest({
      find,
      replaceWith: context.propsValue.replace_with ?? '',
      matchCase: context.propsValue.match_case !== false,
      pageObjectIds: slidesRequests.readSlideObjectIds(context.propsValue.slide_object_ids),
    });
    const accessToken = await getAccessToken(context.auth);
    const response = await slidesApi
      .batchUpdate({ accessToken, presentationId, requests: [request] })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'replace the text' });
      });
    return {
      presentationId,
      occurrencesChanged: slidesRequests.occurrencesChanged({ replies: response.replies, key: 'replaceAllText' }),
    };
  },
});
