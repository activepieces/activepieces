import { createAction, Property } from '@activepieces/pieces-framework';
import { Configuration, OpenAIApi } from 'openai';
import { encoding_for_model, type Tiktoken } from 'tiktoken';
import { openaiAuth } from '../..';
import { createHash } from 'crypto';

const splitByToken = (enc: Tiktoken, text: string, minToken = 1) => {
  const encodedTextInput = enc.encode(text);
  const textSplited: string[] = [];
  for (let index = 0; index < encodedTextInput.length; index += minToken) {
    textSplited.push(
      new TextDecoder().decode(
        enc.decode(encodedTextInput.slice(index, index + minToken))
      )
    );
  }
  return textSplited;
};

const recursiveSpliting = (
  enc: Tiktoken,
  text: string,
  maxTokens: number,
  charsPriority: string[],
) => {
  const textSplited: string[] = [];
  const chars =  charsPriority.pop()
  if (!chars) {
    return splitByToken(enc, text)
  }

  const chuncks = text.split(new RegExp('(?<=[' + chars + '])'));
  
  for (const chunck of chuncks) {
    if (enc.encode(chunck).length > maxTokens) {
      textSplited.push(...recursiveSpliting(enc, chunck, maxTokens, charsPriority));
    } else {
      textSplited.push(chunck);
    }
  }
  charsPriority.push(chars)
  return textSplited
}

const splitBychar = (
  enc: Tiktoken,
  text: string,
  minToken: number,
  maxTokens: number,
  charsPriority: string[]
) => {
  const recursiveSplit = recursiveSpliting(enc, text, maxTokens, charsPriority);
  const textSplited: string[] = [];
  let tokenCount = 0
  let lastPushIndex = 0
  
  for (let i = 0; i < recursiveSplit.length; i++) {
    const chunck = recursiveSplit[i];
    tokenCount += enc.encode(chunck).length
    if (tokenCount > maxTokens) {
      recursiveSplit.splice(i, 1, ...recursiveSpliting(enc, chunck, maxTokens - tokenCount, charsPriority))
    }
    if (tokenCount >= minToken) {
      textSplited.push(recursiveSplit.slice(lastPushIndex, i + 1).join(''))
      lastPushIndex = i + 1
      tokenCount = 0
    }
  }

  return textSplited
};

export const createEmbeddingsFromText = createAction({
  auth: openaiAuth,
  name: 'create_embeddings',
  displayName: 'Generate embeddings',
  description: 'Chuck a text and generate embeddings for it',
  props: {
    textInput: Property.LongText({
      displayName: 'Text Input',
      description: 'Enter the text input you want to tarsform to embeddings',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Document Title or Md5 ID',
      description: 'What is the title or the ID of the text or document you\'ve inputted',
      required: true,
    }),
    splitBy: Property.StaticDropdown({
      displayName: 'Split by',
      description: 'Define where the text will be split',
      options: {
        options: [
          {
            label: 'By Token',
            value: 'token',
          },
          {
            label: 'By space',
            value: 'space',
          },
          {
            label: 'By sentence',
            value: 'sentence',
          },
          {
            label: 'By paragraph',
            value: 'paragraph',
          },
          {
            label: 'Keep all the text',
            value: 'keep',
          }
        ],
      },
      defaultValue: 'paragraph',
      required: true,
    }),
    minTokenByEmbeddings: Property.Number({
      displayName: 'Min number of token by embedding',
      description: 'After which number of tokens the text will be split',
      defaultValue: 250,
      required: false,
    }),
    maxTokenByEmbeddings: Property.Number({
      displayName: 'Max number of token by embedding',
      description:
        'After the text was split, if this value is inferior to the number of tokens, the text will be split arbitrarily',
      defaultValue: 8191,
      required: false,
    }),
  },
  requireAuth: true,
  run: async ({ auth, propsValue }) => {
    const MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS = 8191;

    const configuration = new Configuration({
      apiKey: auth,
    });

    const openai = new OpenAIApi(configuration);

    const minTokens = propsValue.minTokenByEmbeddings ?? 250;
    const maxTokens = propsValue.maxTokenByEmbeddings ?? MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS;
    
    if (
      maxTokens > MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS ||
      minTokens> MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS
    ) throw new Error(
      `maxTokenByEmbeddings and  minTokenByEmbeddings must be inferior or equal to ${MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS} because it is the max number of tokens supported by the openai text-embedding-ada-002 model`
    );

    if (minTokens> maxTokens) 
      throw new Error('minTokenByEmbeddings cannot be superior to maxTokenByEmbeddings')


    const model = 'text-embedding-ada-002';
    const textInput = propsValue.textInput as unknown as string | string[];
    const enc = encoding_for_model(model);

    const textSplited: string[] = [];
    const splitText = (textInput: string) => {
      switch (propsValue.splitBy) {
        case 'token':
          textSplited.push(...splitByToken(
            enc,
            textInput,
            minTokens
          ));
          break;
        case 'space':
          textSplited.push(...splitBychar(
            enc,
            textInput,
            minTokens,
            maxTokens,
            [' ']
          ));
          break;
        case 'sentence':
          textSplited.push(...splitBychar(
            enc,
            textInput,
            minTokens,
            maxTokens,
            [' ', ':}]),;»”', '!?.']
          ));
          break;
        case 'paragraph':
          textSplited.push(...splitBychar(
            enc,
            textInput,
            minTokens,
            maxTokens,
            [' ', ':}]),;»”', '!?.', '\n']
          ));
          break;
        case 'keep':
          textSplited.push(...splitByToken(
            enc,
            textInput,
            MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS
          ));
          break;
      }
    }

    if (textInput instanceof Array) {
      for (const text of textInput) {
        splitText(text);
      }
    } else {
      splitText(textInput)
    }

    enc.free();

    const response = await openai.createEmbedding({
      model: model,
      input: textSplited,
    });

    let documentTitle = propsValue.title
    let documentId = createHash('md5').update(documentTitle).digest('hex')

    const validateMd5Id = (hash: string) => /^[a-f0-9]{32}$/i.test(hash)
    
    if (validateMd5Id(documentTitle)) {
      documentId = documentTitle
      documentTitle = (textInput instanceof Array ? textInput[0]: textInput).slice(0, 50).split(/[.?,/\\!;:()"]/u)[0]
    }

    const resData = response.data.data
    const embeddings = []
    const chuncksOfText =  []
    const embeddingIds = []

    for (let index = 0; index < resData.length; index++) {
      const vec = resData[index];
      embeddings.push(vec.embedding)
      chuncksOfText.push(textSplited[index])
      embeddingIds.push(createHash('md5').update(textSplited[index]).digest('hex'))
    }

    return {
      documentTitle,
      documentId,
      chuncksOfText,
      embeddings,
      embeddingIds
    }
  },
});
