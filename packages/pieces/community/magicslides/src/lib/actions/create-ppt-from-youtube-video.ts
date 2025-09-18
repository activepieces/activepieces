import { createAction, Property } from '@activepieces/pieces-framework';
import { magicslidesAuth } from '../auth';
import { apiRequest } from '../common';
import { templateDropdown, languageDropdown, slidesCountNumber, aiImagesCheckbox, imageForEachSlideCheckbox, googleImageCheckbox, googleTextCheckbox, modelDropdown, presentationForShortText, watermarkWidthShortText, watermarkHeightShortText, watermarkBrandURLShortText, watermarkPositionDropdown } from '../properties';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPptFromYoutubeVideo = createAction({
  name: 'create_ppt_from_youtube_video',
  displayName: 'Create PPT from Youtube Video',
  description: 'Creates a PPT from given youtube video',
  auth: magicslidesAuth,
  props: {
    youtubeURL: Property.ShortText({
      displayName: 'YouTube URL',
      description: 'The YouTube video URL to convert into a presentation',
      required: true,
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
      youtubeURL,
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
      youtubeURL,
    };

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
      path: '/public/api/ppt_from_youtube',
      method: HttpMethod.POST,
      body: requestData,
    });

    return response.body;
  },
});