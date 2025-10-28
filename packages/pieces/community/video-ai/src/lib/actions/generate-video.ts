import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { ApFile, createAction, Property } from "@activepieces/pieces-framework"
import { spreadIfDefined } from "@activepieces/shared";
import { SUPPORTED_AI_PROVIDERS, aiProps, AI_USAGE_FEATURE_HEADER, AIUsageFeature } from "@activepieces/common-ai";
import { GoogleGenAI } from "@google/genai";
import mime from 'mime-types';

type GenerateVideoParams =  {
    apiKey: string,
    baseUrl: string,
    image: ApFile|undefined,
    prompt: string,
    advancedOptions: any,
    modelInstance: { modelId: string },
}
const generateVideoForGoogle = async (
    {
        apiKey,
        baseUrl,    
        image,
        prompt,
        advancedOptions,
        modelInstance
    }:GenerateVideoParams
   
)=>{
    const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
            baseUrl,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                [AI_USAGE_FEATURE_HEADER]: AIUsageFeature.VIDEO_AI,
            },
        },
    });

    let imageBytes: string | undefined;
    const fileType = image?.extension ? mime.lookup(image.extension) : 'image/jpeg';
    if (image && fileType && fileType.startsWith('image')) {
        imageBytes = image.base64;
    }

    const imageConfig = imageBytes ? {
        imageBytes,
        mimeType: fileType || undefined,
    } : undefined;

    let operation = await ai.models.generateVideos({
        ...spreadIfDefined('image', imageConfig),
        model: modelInstance.modelId,
        prompt,
        config: {
            numberOfVideos: 1,
            ...advancedOptions,
        },
    });

    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({
            operation,
        })
    }

    const videoFileId = operation.response?.generatedVideos?.[0]?.video?.uri?.split('/').pop()
    if (!videoFileId) {
        throw new Error('No video file IDs found');
    }
    // google api requires authentication to get the file so we hit the proxy url
    const proxyUrl = `${baseUrl}/download/v1beta/files/${videoFileId}`;
    return proxyUrl;
}

export const generateVideo = createAction({
    name: 'generate-video',
    displayName: 'Generate Video',
    description: '',
    props: {
        provider: aiProps({ modelType: 'video' }).provider,
        model: aiProps({ modelType: 'video' }).model,
        prompt: Property.LongText({
            displayName: 'Prompt',
            required: true,
        }),
        image: Property.File({
            displayName: 'First Frame Image',
            required: false,
            description: 'The first frame that the video will start with.',
        }),
        advancedOptions: aiProps({ modelType: 'video' }).advancedOptions,
    },
    async run(context) {
        const { provider, model, prompt,  image, advancedOptions } = context.propsValue
        const providerName = provider as string;
        const modelInstance = model as { modelId: string };

        const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
        if (!providerConfig) {
            throw new Error(`Provider ${providerName} not found`);
        }

        const baseUrl = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
        let videoFileUrl: string | undefined;
        if(providerName === 'google') {
            videoFileUrl = await generateVideoForGoogle({
                apiKey: context.server.token,
                baseUrl,
                image,
                prompt,
                advancedOptions,
                modelInstance,
            });
        }
        else {
            throw new Error(`Provider ${providerName} not supported`);
        }
    
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: videoFileUrl,
            responseType: 'arraybuffer',
            headers: {
                'Authorization': `Bearer ${context.server.token}`,
            },
        });
    
        return context.files.write({
            data: Buffer.from(response.body),
            fileName: 'video.mp4',
        });
      
    }
})
