import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { Background, slidesElementRequests } from '../commons/element-requests';
import { slidesElements } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS, slidesRequests } from '../commons/requests';
import { setSlideBackgroundOutputSchema } from '../output-schemas';

export const setSlideBackground = createAction({
  auth: googleSlidesAuth,
  name: 'set_slide_background',
  classification: 'WRITE',
  displayName: 'Set Slide Background',
  description: 'Set a solid colour or an image as the background of one slide or all slides.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set the background of one slide (by number or object ID) or of every slide (All Slides) to a solid hex colour or to a public image URL stretched to fill the slide. Use it for slide backgrounds; to add a picture on top of the slide use Insert Image. Set exactly one of Color or Image URL. Idempotent: the same values give the same result.',
    idempotent: true,
  },
  outputSchema: setSlideBackgroundOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    all_slides: Property.Checkbox({
      displayName: 'All Slides',
      description: 'Turn on to change every slide. Leave Slide Number and Slide Object ID empty when using this.',
      required: false,
    }),
    color: slidesProps.colorProp({ displayName: 'Color', description: 'Hex colour, e.g. #0B1F3A.' }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public PNG, JPEG or GIF URL to stretch over the slide, e.g. https://example.com/bg.png.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const allSlides = slidesElements.readBoolean({ value: propsValue.all_slides, label: 'All Slides' }) ?? false;
    const hasSlide =
      (propsValue.slide_number !== undefined && propsValue.slide_number !== null) ||
      (typeof propsValue.slide_object_id === 'string' && propsValue.slide_object_id.trim() !== '');
    if (allSlides && hasSlide) {
      throw new Error('All Slides is on: leave Slide Number and Slide Object ID empty.');
    }
    const selector = allSlides
      ? undefined
      : slidesRequests.readSlideSelector({ slideNumber: propsValue.slide_number, slideObjectId: propsValue.slide_object_id });
    const background = readBackground({ color: propsValue.color, imageUrl: propsValue.image_url });
    const accessToken = await getAccessToken(context.auth);
    const action = 'set the slide background';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.slideIds })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const slides = presentation.slides ?? [];
    const slideObjectIds = selector
      ? [slidesRequests.resolveSlide({ slides, selector }).objectId]
      : slides.map((slide) => slide.objectId);
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: slidesElementRequests.buildBackgroundRequests({ slideObjectIds, background }),
      revisionId: presentation.revisionId,
      action,
    });
    return {
      presentationId,
      slideObjectIds,
      slideCount: slideObjectIds.length,
      backgroundType: background.kind === 'color' ? 'COLOR' : 'IMAGE',
      color: background.kind === 'color' ? background.hex : null,
      imageUrl: background.kind === 'image' ? background.imageUrl : null,
    };
  },
});

function readBackground({ color, imageUrl }: { color: unknown; imageUrl: unknown }): Background {
  const colorText = typeof color === 'string' ? color.trim() : '';
  const imageText = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  if ((colorText === '') === (imageText === '')) {
    throw new Error('Set exactly one of Color (hex, e.g. #0B1F3A) or Image URL.');
  }
  if (colorText) {
    return {
      kind: 'color',
      rgbColor: slidesElements.parseHexColor({ value: colorText, label: 'Color' }),
      hex: slidesElements.normaliseHex(colorText),
    };
  }
  return { kind: 'image', imageUrl: slidesIds.validateImageUrl(imageText) };
}
