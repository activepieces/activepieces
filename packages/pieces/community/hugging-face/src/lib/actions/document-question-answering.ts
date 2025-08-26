import { createAction, Property } from '@activepieces/pieces-framework';
import {
  type DocumentQuestionAnsweringArgs,
  InferenceClient,
} from '@huggingface/inference';
import { huggingFaceAuth } from '../../index';

export const documentQuestionAnswering = createAction({
  name: 'document_question_answering',
  auth: huggingFaceAuth,
  displayName: 'Document Question Answering',
  description:
    'Answer questions from document images using Hugging Face models',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Hugging Face document question answering model',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'impira/layoutlm-document-qa (Recommended)',
            value: 'impira/layoutlm-document-qa',
          },
          {
            label: 'microsoft/layoutlmv3-base',
            value: 'microsoft/layoutlmv3-base',
          },
          {
            label: 'nielsr/layoutlmv2-finetuned-docvqa',
            value: 'nielsr/layoutlmv2-finetuned-docvqa',
          },
        ],
      },
      defaultValue: 'impira/layoutlm-document-qa',
    }),
    image: Property.File({
      displayName: 'Document Image',
      description: 'Image of the document to analyze (invoice, contract, etc.)',
      required: true,
    }),
    question: Property.ShortText({
      displayName: 'Question',
      description:
        "Question to ask about the document (e.g., 'What is the invoice total?')",
      required: true,
    }),
    top_k: Property.Number({
      displayName: 'Number of Answers',
      description: 'Number of top answers to return',
      required: false,
      defaultValue: 1,
    }),
    max_answer_len: Property.Number({
      displayName: 'Max Answer Length',
      description: 'Maximum length of predicted answers',
      required: false,
    }),
    handle_impossible_answer: Property.Checkbox({
      displayName: 'Handle Impossible Answers',
      description:
        "Whether to accept 'impossible' as an answer when no answer is found",
      required: false,
      defaultValue: true,
    }),
    lang: Property.StaticDropdown({
      displayName: 'OCR Language',
      description: 'Language to use for OCR text extraction',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
        ],
      },
      defaultValue: 'en',
    }),
    use_cache: Property.Checkbox({
      displayName: 'Use Cache',
      description: 'Use cached results if available',
      required: false,
      defaultValue: true,
    }),
    wait_for_model: Property.Checkbox({
      displayName: 'Wait for Model',
      description: 'Wait for model to load if not ready',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      model,
      image,
      question,
      top_k,
      max_answer_len,
      handle_impossible_answer,
      lang,
      use_cache,
      wait_for_model,
    } = context.propsValue;

    const getMimeType = (filename: string): string => {
      const extension = filename.split('.').pop()?.toLowerCase() ?? '';
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'bmp':
          return 'image/bmp';
        case 'tiff':
        case 'tif':
          return 'image/tiff';
        case 'pdf':
          return 'application/pdf';
        default:
          return 'application/octet-stream';
      }
    };

    const hf = new InferenceClient(context.auth as string);
    const mimeType = getMimeType(image.filename);
    const imageBlob = new Blob([new Uint8Array(image.data)], {
      type: mimeType,
    });

    const args: DocumentQuestionAnsweringArgs = {
      model: model,
      inputs: {
        image: imageBlob,
        question: question,
      },
      options: {
        use_cache: use_cache ?? true,
        wait_for_model: wait_for_model ?? false,
      },
    };

    const parameters: {
      top_k?: number;
      max_answer_len?: number;
      handle_impossible_answer?: boolean;
      lang?: string;
    } = {};

    if (top_k !== undefined) {
      parameters.top_k = top_k;
    }

    if (max_answer_len !== undefined) {
      parameters.max_answer_len = max_answer_len;
    }

    if (handle_impossible_answer !== undefined) {
      parameters.handle_impossible_answer = handle_impossible_answer;
    }

    if (lang) {
      parameters.lang = lang;
    }

    if (Object.keys(parameters).length > 0) {
      args.parameters = parameters;
    }

    const result = await hf.documentQuestionAnswering(args);

    return {
      answer: result.answer,
      score: result.score,
      start: result.start,
      end: result.end,
      raw_result: result,
    };
  },
});
