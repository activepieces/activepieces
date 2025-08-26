import { Readable } from 'node:stream';
import { aiProps, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AI_USAGE_FEATURE_HEADER, AIUsageFeature } from '@activepieces/shared';
import { ActionContext, ApFile, createAction, InputPropertyMap, PieceAuthProperty, Property } from '@activepieces/pieces-framework';
import { TranscriptionModel } from 'ai';
import OpenAI, { toFile } from 'openai';
import { createPartFromUri, createUserContent, GoogleGenAI } from '@google/genai';
import mime from 'mime-types';
import fs from 'fs';

export const transcribeAudio = createAction({
  name: 'transcribe',
  displayName: 'Transcribe Audio',
  description: 'Transcribe audio into text.',
  props: {
    provider: aiProps({ modelType: 'transcription' }).provider,
    model: aiProps({ modelType: 'transcription' }).model,
    audio: Property.File({
      displayName: 'Audio',
      description: 'The audio file to transcribe. Supported formats for OpenAI: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm. Supported formats for Gemini: wav, mp3, aiff, aac, ogg or flac.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'An optional prompt to guide the transcription. It must be in the same language as the audio.',
      required: false,
    }),
  },
  async run(context) {
    const providerName = context.propsValue.provider as string;
    const modelInstance = context.propsValue.model as TranscriptionModel;
    const audio = context.propsValue.audio;
    const prompt = context.propsValue.prompt;

    if (providerName === 'openai') {
      return transcribeWithOpenAI({ context, audio, prompt, providerName, modelInstance });
    }

    const response = await transcribeWithGoogle({ context, audio, prompt, providerName, modelInstance });

    return response;
  },
})

const transcribeWithOpenAI = async ({ context, audio, providerName, modelInstance, prompt }: TranscribeParams) => {
  const audioFile = await toFile(
    Readable.from(audio.data),
    audio.filename
  );
  console.log('this is the audio file', audioFile)

  const client = new OpenAI({
    apiKey: context.server.token,
    baseURL: `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}/v1`,
    defaultHeaders: {
      [AI_USAGE_FEATURE_HEADER]: AIUsageFeature.VOICE_AI,
      'Authorization': `Bearer ${context.server.token}`,
    },
  });

  const response = await client.audio.transcriptions.create({
    model: modelInstance.modelId,
    file: Readable.from(Buffer.from(audio.base64, 'base64')) as any,
    prompt,
    
  });

  // const response = await httpClient.sendRequest<{ text: string }>({
  //   method: HttpMethod.POST,
  //   url: `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}/v1/audio/transcriptions`,
  //   headers: {
  //     [AI_USAGE_FEATURE_HEADER]: AIUsageFeature.VOICE_AI,
  //     'Authorization': `Bearer ${context.server.token}`,
  //   },
  //   body: {
  //     model: modelInstance.modelId,
  //     file: {
  //       data: audio.base64,
  //       mimeType: mime.lookup(audio.filename) || 'audio/mpeg',
  //     },
  //     prompt,
  //   },
  // })

  return response.text;
}


const transcribeWithGoogle = async ({ context, audio, providerName, modelInstance, prompt }: TranscribeParams) => {
  console.error(context.server.apiUrl, 'context.server.apiUrl')
  const ai = new GoogleGenAI({
    apiKey: context.server.token,
    httpOptions: {
      baseUrl: `${context.server.apiUrl}v1/ai-providers/proxy/${providerName}`,
      headers: {
        [AI_USAGE_FEATURE_HEADER]: AIUsageFeature.VOICE_AI,
        'Authorization': `Bearer ${context.server.token}`,
      },
    }
  });

  const response = await ai.models.generateContent({
    model: modelInstance.modelId,
    contents: [
      {
        inlineData: {
          data: audio.base64,
          mimeType: mime.lookup(audio.filename) || 'audio/mpeg',
        },
      },
      {
        text: prompt ?? '',
      },
    ],
  });

  return response.text;
}

type TranscribeParams = {
  context: ActionContext<PieceAuthProperty, InputPropertyMap>;
  audio: ApFile;
  providerName: string;
  modelInstance: TranscriptionModel;
  prompt?: string;
}