import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS, PREDEFINED_LAYOUTS, slidesRequests } from '../commons/requests';
import { addSlideOutputSchema } from '../output-schemas';

export const addSlide = createAction({
  auth: googleSlidesAuth,
  name: 'add_slide',
  classification: 'WRITE',
  displayName: 'Add Slide',
  description: 'Add a new slide with a layout, and optionally fill its title and body.',
  audience: 'both',
  aiMetadata: {
    description:
      "Insert a new slide using one of the theme's standard layouts (e.g. TITLE_AND_BODY, TITLE, SECTION_HEADER, BLANK) at a 1-based position or at the end, optionally writing a title and body into the layout's placeholders (the TITLE layout uses its subtitle as the body). Use it to build or extend a deck; to reuse an existing slide's design use Duplicate Slide. Fails without changes if the theme lacks the layout or a needed placeholder. Not idempotent: each call adds another slide.",
    idempotent: false,
  },
  outputSchema: addSlideOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    layout: Property.StaticDropdown({
      displayName: 'Layout',
      description: "Layout of the new slide, from the presentation's theme.",
      required: true,
      defaultValue: 'TITLE_AND_BODY',
      options: { options: PREDEFINED_LAYOUTS },
    }),
    position: Property.Number({
      displayName: 'Position',
      description: 'Where to put the slide, starting at 1 for the first slide. Leave empty to add it at the end.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Text for the slide title. Leave empty to keep the placeholder empty.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Text for the body (or the subtitle, on the Title slide layout). New lines start new paragraphs.',
      required: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const layout = context.propsValue.layout;
    if (!PREDEFINED_LAYOUTS.some((option) => option.value === layout)) {
      throw new Error(`Layout must be one of: ${PREDEFINED_LAYOUTS.map((option) => option.value).join(', ')}.`);
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'add the slide';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.addSlide })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const slideCount = presentation.slides?.length ?? 0;
    const insertionIndex = slidesRequests.readPosition({
      position: context.propsValue.position,
      maxPosition: slideCount + 1,
    });
    const built = slidesRequests.buildAddSlideRequests({
      layouts: presentation.layouts ?? [],
      predefinedLayout: layout,
      insertionIndex,
      title: context.propsValue.title ?? undefined,
      body: context.propsValue.body ?? undefined,
      newId: slidesIds.generateObjectId,
    });
    await slidesApi
      .batchUpdate({
        accessToken,
        presentationId,
        requests: built.requests,
        requiredRevisionId: presentation.revisionId,
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    return {
      presentationId,
      slideObjectId: built.slideObjectId,
      slideNumber: (insertionIndex ?? slideCount) + 1,
      slideUrl: slidesApi.slideUrl({ presentationId, slideObjectId: built.slideObjectId }),
      titleObjectId: built.titleObjectId,
      bodyObjectId: built.bodyObjectId,
    };
  },
});
