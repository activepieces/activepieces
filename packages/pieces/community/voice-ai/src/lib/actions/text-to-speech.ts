// import { aiProps, httpClient, HttpMethod } from '@activepieces/pieces-common';
// import { AIUsageFeature, SUPPORTED_AI_PROVIDERS, createAIProvider } from '@activepieces/shared';
// import { createAction, Property } from '@activepieces/pieces-framework';
// import { CoreMessage, LanguageModel, SpeechModel, generateText } from 'ai';

// export const textToSpeech = createAction({
//   name: 'textToSpeech',
//   displayName: 'Text to Speech',
//   description: '',
//   props: {
//     provider: aiProps({ modelType: 'speech' }).provider,
//     model: aiProps({ modelType: 'speech' }).model,
//     text: Property.LongText({
//       displayName: 'Text',
//       required: true,
//     }),
    
//   },
//   async run(context) {
//     const providerName = context.propsValue.provider as string;
//     const modelInstance = context.propsValue.model as SpeechModel;

//     const providerConfig = SUPPORTED_AI_PROVIDERS.find(p => p.provider === providerName);
//     const baseURL = `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`;
//     const engineToken = context.server.token;
    
//     const response = await httpClient.sendRequest({
//       method: HttpMethod.POST,
//       url: `${baseURL}/audio/speech`,
//       headers: {
//         'Authorization': `Bearer ${engineToken}`
//       },
//       body: {
//         model: modelInstance.modelId,
//         input: context.propsValue.text,

//       },
//     })

//     const { text } = context.propsValue;

//   },
// })