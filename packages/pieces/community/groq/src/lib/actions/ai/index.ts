import { createChatCompletionAction } from './create-chat-completion';
import { createResponseAction } from './create-response';
import { createSpeechAction } from './create-speech';
import { createTranscriptionAction } from './create-transcription';
import { createTranslationAction } from './create-translation';
import { getModelAction } from './get-model';
import { listModelsAction } from './list-models';

export const groqAiActions = [
  createChatCompletionAction,
  createResponseAction,
  createSpeechAction,
  createTranscriptionAction,
  createTranslationAction,
  listModelsAction,
  getModelAction,
];
