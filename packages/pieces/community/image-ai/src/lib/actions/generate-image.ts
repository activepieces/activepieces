import { ApFile, createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { AIUsageFeature, createAIModel, SUPPORTED_AI_PROVIDERS } from '@activepieces/common-ai';
import { generateText, ImageModel, ImagePart } from 'ai';
import { experimental_generateImage as generateImage } from 'ai';
import { aiProps } from '@activepieces/common-ai';
import { LanguageModelV2 } from '@ai-sdk/provider';
import mime from 'mime-types';
import { isNil } from '@activepieces/shared';

const getGeneratedImage = async ({
  providerName,
  modelInstance,
  engineToken,
  baseURL,
  prompt,
  advancedOptions,
}: {
  providerName: string;
  modelInstance: LanguageModelV2 | ImageModel;
  engineToken: string;
  baseURL: string;
  prompt: string;
  advancedOptions?: DynamicPropsValue;
}) =>{
  
  if(providerName === 'google') {
  const model = createAIModel({
    providerName,
    modelInstance: modelInstance as LanguageModelV2,
    engineToken,
    baseURL,
    metadata: {
      feature: AIUsageFeature.IMAGE_AI,
    },
  });
  const images = advancedOptions?.['image'] as Array<{ file: ApFile }> | undefined ?? [];
  const imageFiles = images.map<ImagePart>(image => {
    const fileType = image.file.extension ? mime.lookup(image.file.extension) : 'image/jpeg';
    return {
      type: 'image',
      image: `data:${fileType};base64,${image.file.base64}`,
    }
  });
  const result = await generateText({
    model,
    providerOptions: {
      google: { responseModalities: ['TEXT', 'IMAGE'] },
    },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            ...imageFiles,
          ],
        },
       
      ]
  });
   const responseBody =  result.response.body && typeof result.response.body === 'object' && 'candidates' in result.response.body ? result.response.body : { candidates: [] };
   const responseCandidates =  Array.isArray(responseBody?.candidates) ? responseBody?.candidates : [];
   responseCandidates.forEach(candidate => {
     if(candidate.finishReason !== 'STOP') {
      throw new Error('Image generation failed Reason:\n ' + JSON.stringify(responseCandidates, null, 2));
     }
   })
   if(isNil(result.files) || result.files.length === 0) {
    throw new Error('No image generated');
   }
   return  result.files[0];
   }
   else{
    const response = await generateImage({
      model: modelInstance as ImageModel,
      prompt: prompt,
      providerOptions: {
        [providerName]: {
          ...advancedOptions,
        },
      },
    });
    return response.image;
   }
}

export const generateImageAction = createAction({
  name: 'generateImage',
  displayName: 'Generate Image',
  description: '',
  props: {
    provider: aiProps({ modelType: 'image' }).provider,
    model: aiProps({ modelType: 'image' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    advancedOptions: aiProps({ modelType: 'image' }).advancedOptions,
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;


    const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
    const engineToken = context.server.token;
    const image = await getGeneratedImage({
      providerName,
      modelInstance: context.propsValue.model as LanguageModelV2 | ImageModel,
      engineToken,
      baseURL,
      prompt: context.propsValue.prompt,
      advancedOptions: context.propsValue.advancedOptions,
    });

     const imageData = image.base64 && image.base64.length > 0 ? Buffer.from(image.base64, 'base64') : Buffer.from(image.uint8Array);
     return context.files.write({
      data: imageData,
      fileName: 'image.png',
     });
  },
});
