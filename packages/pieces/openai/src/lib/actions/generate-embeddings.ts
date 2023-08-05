import { createAction, Property } from '@activepieces/pieces-framework';
import { Configuration, OpenAIApi } from 'openai';
import { encoding_for_model, type Tiktoken } from 'tiktoken';
import { openaiAuth } from '../..';
import { createHash } from 'crypto';


const slpitByToken = (enc: Tiktoken, text: string, minToken: number) => {
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

const splitBychar = (
  enc: Tiktoken,
  text: string,
  minToken: number,
  maxTokens: number,
  chars: string
) => {
  const textSplited: string[] = [];
  const chuncks = text.split(new RegExp('/(?<=[' + chars + '])/')); // split by all the chars in the {chars} variable but keep the char used to split
  let tokenCount = 0;
  for (let index = 0; index < chuncks.length; index++) {
    const chunck = chuncks[index];
    
    tokenCount += enc.encode(chunck).length;
    if (tokenCount >= minToken || index === chuncks.length - 1) {
      if (tokenCount > maxTokens) {
        const splitAgain = slpitByToken(enc, chunck, minToken);
        for (const split of splitAgain) {
          textSplited.push(split);
        }
      } else {
        textSplited.push(chunck);
      }
      tokenCount = 0;
    } 
  }
  return textSplited;
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
            label: 'By token',
            value: 'token',
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
      required: false,
    }),
    minTokenByEmbeddings: Property.Number({
      displayName: 'Min number of token by embedding',
      description: 'After which number of tokens the text will be split',
      defaultValue: 500,
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

    propsValue.splitBy ??= 'paragraph';
    propsValue.minTokenByEmbeddings ??= 500;
    propsValue.maxTokenByEmbeddings ??= MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS;
    if (
      propsValue.maxTokenByEmbeddings > MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS ||
      propsValue.minTokenByEmbeddings > MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS
    ) {
      throw new Error(
        `maxTokenByEmbeddings and  minTokenByEmbeddings must be inferior or equal to ${MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS} because it is the max number of tokens supported by the openai text-embedding-ada-002 model`
      );
    }
    propsValue.splitBy ??= 'paragraph';

    const model = 'text-embedding-ada-002';
    const textInput = propsValue.textInput;
    const enc = encoding_for_model(model);

    let textSplited: string[] = [];

    if (propsValue.splitBy === 'token') {
      textSplited = slpitByToken(
        enc,
        textInput,
        propsValue.minTokenByEmbeddings
      );
    } else if (propsValue.splitBy === 'sentence') {
      textSplited = splitBychar(
        enc,
        textInput,
        propsValue.minTokenByEmbeddings,
        propsValue.maxTokenByEmbeddings,
        '!?.'
      );
    } else if (propsValue.splitBy === 'paragraph') {
      textSplited = splitBychar(
        enc,
        textInput,
        propsValue.minTokenByEmbeddings,
        propsValue.maxTokenByEmbeddings,
        '\n'
      );
    } else if (propsValue.splitBy === 'keep') {
      textSplited = slpitByToken(
        enc,
        textInput,
        MAX_TOKENS_SUPPORTED_BY_EMBEDDINGS
      );
    } 

    enc.free();

    // console.log('Before run: \n\ttextSplited: ', textSplited)

    const response = await openai.createEmbedding({
      model: model,
      input: textSplited,
    });

    let documentTitle = propsValue.title
    let documentId = createHash('md5').update(documentTitle).digest('hex')

    const validateMd5 = (hash: string) => /^[a-f0-9]{32}$/i.test(hash)
    
    if (validateMd5(documentTitle)) {
      documentId = documentTitle
      documentTitle = textInput.slice(0, 50).split(/[.?,/\\!;:()"]/u)[0]
    }

    const resData = response.data.data
    const embeddings = []
    const chuncksOfText =  []
    const embeddingIds = []

    for (let index = 0; index < resData.length; index++) {
      const vec = resData[index];
      embeddings.push(vec)
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
