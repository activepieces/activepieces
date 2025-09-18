import { createAction, Property } from '@activepieces/pieces-framework';
import { magicslidesAuth } from '../auth';
import { apiRequest } from '../common';
import { templateDropdown, languageDropdown, slidesCountNumber, aiImagesCheckbox, imageForEachSlideCheckbox, googleImageCheckbox, googleTextCheckbox, modelDropdown, presentationForShortText, watermarkWidthShortText, watermarkHeightShortText, watermarkBrandURLShortText, watermarkPositionDropdown } from '../properties';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPptFromTopic = createAction({
  name: 'create_ppt_from_topic',
  displayName: 'Create PPT from Topic',
  description: 'Creates a PPT from given topic',
  auth: magicslidesAuth,
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The topic you want to generate a presentation about',
      required: true,
    }),
    extraInfoSource: Property.LongText({
      displayName: 'Extra Info Source',
      description: 'Additional context or specific focus areas for the presentation',
      required: false,
    }),
    template: templateDropdown,
    language: languageDropdown,
    slidesCount: slidesCountNumber,
    aiImages: aiImagesCheckbox,
    imageForEachSlide: imageForEachSlideCheckbox,
    googleImage: googleImageCheckbox,
    googleText: googleTextCheckbox,
    model: modelDropdown,
    presentationFor: presentationForShortText,
    watermarkWidth: watermarkWidthShortText,
    watermarkHeight: watermarkHeightShortText,
    watermarkBrandURL: watermarkBrandURLShortText,
    watermarkPosition: watermarkPositionDropdown,
  },
  async run({ auth, propsValue }) {
    const {
      topic,
      extraInfoSource,
      template,
      language,
      slidesCount,
      aiImages,
      imageForEachSlide,
      googleImage,
      googleText,
      model,
      presentationFor,
      watermarkWidth,
      watermarkHeight,
      watermarkBrandURL,
      watermarkPosition
    } = propsValue;

    const requestData: any = {
      topic,
    };

    if (extraInfoSource) requestData.extraInfoSource = extraInfoSource;
    if (template) requestData.template = template;
    if (language) requestData.language = language;
    if (slidesCount) requestData.slideCount = slidesCount;
    if (aiImages !== undefined) requestData.aiImages = aiImages;
    if (imageForEachSlide !== undefined) requestData.imageForEachSlide = imageForEachSlide;
    if (googleImage !== undefined) requestData.googleImage = googleImage;
    if (googleText !== undefined) requestData.googleText = googleText;
    if (model) requestData.model = model;
    if (presentationFor) requestData.presentationFor = presentationFor;

    if (watermarkWidth || watermarkHeight || watermarkBrandURL || watermarkPosition) {
      requestData.watermark = {};
      if (watermarkWidth) requestData.watermark.width = watermarkWidth;
      if (watermarkHeight) requestData.watermark.height = watermarkHeight;
      if (watermarkBrandURL) requestData.watermark.brandURL = watermarkBrandURL;
      if (watermarkPosition) requestData.watermark.position = watermarkPosition;
    }

    const response = await apiRequest({
      auth,
      path: '/public/api/ppt_from_topic',
      method: HttpMethod.POST,
      body: requestData,
    });

    return response.body;
  },
});