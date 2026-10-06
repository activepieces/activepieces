import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { replaceShapesWithImageOutputSchema } from '../output-schemas';

export const replaceShapesWithImage = createAction({
  auth: googleSlidesAuth,
  name: 'replace_shapes_with_image',
  classification: 'WRITE',
  displayName: 'Replace Shapes with Image',
  description: 'Replace every shape that contains a text (e.g. {{logo}}) with an image from a URL.',
  audience: 'both',
  aiMetadata: {
    description:
      "Replace every shape whose text contains the search text (e.g. a {{logo}} placeholder box) with an image from a public URL, fitted to the shape's size, optionally only on chosen slides. Use it for the image part of mail-merge decks after Generate from Template or Copy Presentation; to add an image at fixed coordinates use Insert Image. The URL must be public, PNG/JPEG/GIF, under 50 MB and 25 megapixels. Idempotent: replaced shapes are gone, so a repeat changes nothing.",
    idempotent: true,
  },
  outputSchema: replaceShapesWithImageOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    find: Property.ShortText({
      displayName: 'Shape Text',
      description: 'Shapes containing this text are replaced, e.g. [[logo]]. Activepieces reads {{...}} typed into a field as a reference to earlier step data, so search for [[name]]-style tokens or map the text from a previous step.',
      required: true,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public link to a PNG, JPEG or GIF image (under 50 MB), e.g. https://example.com/logo.png.',
      required: true,
    }),
    replace_method: Property.StaticDropdown({
      displayName: 'Fit',
      description: 'How the image fills the shape.',
      required: false,
      defaultValue: 'CENTER_INSIDE',
      options: {
        options: [
          { label: 'Fit inside the shape (keep the whole image)', value: 'CENTER_INSIDE' },
          { label: 'Fill the shape (crop the image)', value: 'CENTER_CROP' },
        ],
      },
    }),
    match_case: slidesProps.matchCaseProp(),
    slide_object_ids: slidesProps.slideScopeProp(),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const find = context.propsValue.find;
    if (!find) {
      throw new Error('Shape Text is required.');
    }
    const imageUrl = slidesIds.validateImageUrl(context.propsValue.image_url);
    const replaceMethod = context.propsValue.replace_method ?? 'CENTER_INSIDE';
    if (!REPLACE_METHODS.includes(replaceMethod)) {
      throw new Error(`Fit must be one of ${REPLACE_METHODS.join(', ')}.`);
    }
    const request = slidesRequests.buildReplaceShapesRequest({
      find,
      imageUrl,
      replaceMethod,
      matchCase: context.propsValue.match_case !== false,
      pageObjectIds: slidesRequests.readSlideObjectIds(context.propsValue.slide_object_ids),
    });
    const accessToken = await getAccessToken(context.auth);
    const response = await slidesApi
      .batchUpdate({ accessToken, presentationId, requests: [request] })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'replace the shapes with the image' });
      });
    return {
      presentationId,
      occurrencesChanged: slidesRequests.occurrencesChanged({
        replies: response.replies,
        key: 'replaceAllShapesWithImage',
      }),
    };
  },
});

const REPLACE_METHODS = ['CENTER_INSIDE', 'CENTER_CROP'];
