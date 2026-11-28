import { createChatCompletionAction } from './text/create-chat-completion';
import { createClaudeMessageAction } from './text/create-claude-message';
import { createEmbeddingsAction } from './text/create-embeddings';
import { createModerationAction } from './text/create-moderation';
import { createResponseAction } from './text/create-response';
import { geminiGenerateContentAction } from './text/gemini-generate-content';
import { createSpeechAction } from './audio/create-speech';
import { createTranscriptionAction } from './audio/create-transcription';
import { createTranslationAction } from './audio/create-translation';
import { editImageAction } from './image/edit-image';
import { fluxGenerateImageAction } from './image/flux-generate-image';
import { fluxGetResultAction } from './image/flux-get-result';
import { generateImageAction } from './image/generate-image';
import { getImageTaskAction } from './image/get-image-task';
import { klingCreateOmniImageAction } from './image/kling-create-omni-image';
import { klingExpandImageAction } from './image/kling-expand-image';
import { klingGenerateImageAction } from './image/kling-generate-image';
import { klingGetOmniImageAction } from './image/kling-get-omni-image';
import { klingMultiImageToImageAction } from './image/kling-multi-image-to-image';
import { klingVirtualTryOnAction } from './image/kling-virtual-try-on';
import { replicateCreatePredictionAction } from './image/replicate-create-prediction';
import { replicateGetPredictionAction } from './image/replicate-get-prediction';
import { createVideoAction } from './video/create-video';
import { downloadVideoAction } from './video/download-video';
import { getVideoAction } from './video/get-video';
import { grokEditVideoAction } from './video/grok-edit-video';
import { grokGenerateVideoAction } from './video/grok-generate-video';
import { grokGetVideoAction } from './video/grok-get-video';
import { minimaxCreateVideoAction } from './video/minimax-create-video';
import { minimaxGetFileAction } from './video/minimax-get-file';
import { minimaxGetVideoTaskAction } from './video/minimax-get-video-task';
import { klingAddVideoSelectionAction } from './kling/add-video-selection';
import { klingApplyVideoEffectAction } from './kling/apply-video-effect';
import { klingClearVideoSelectionAction } from './kling/clear-video-selection';
import { klingCreateAvatarVideoAction } from './kling/create-avatar-video';
import { klingCreateLipSyncAction } from './kling/create-lip-sync';
import { klingCreateMultiElementVideoAction } from './kling/create-multi-element-video';
import { klingCreateOmniVideoAction } from './kling/create-omni-video';
import { klingDeleteVideoSelectionAction } from './kling/delete-video-selection';
import { klingExtendVideoAction } from './kling/extend-video';
import { klingGetOmniVideoAction } from './kling/get-omni-video';
import { klingGetTaskAction } from './kling/get-task';
import { klingIdentifyFaceAction } from './kling/identify-face';
import { klingImageToVideoAction } from './kling/image-to-video';
import { klingInitVideoSelectionAction } from './kling/init-video-selection';
import { klingMotionControlAction } from './kling/motion-control';
import { klingMultiImageToVideoAction } from './kling/multi-image-to-video';
import { klingPreviewVideoSelectionAction } from './kling/preview-video-selection';
import { klingRecognizeImageAction } from './kling/recognize-image';
import { klingRouteGetTasksAction } from './kling/route-get-tasks';
import { klingRouteImageToVideoAction } from './kling/route-image-to-video';
import { klingRouteMotionControlAction } from './kling/route-motion-control';
import { klingRouteOmniVideoAction } from './kling/route-omni-video';
import { klingRouteTextToVideoAction } from './kling/route-text-to-video';
import { klingTextToAudioAction } from './kling/text-to-audio';
import { klingTextToSpeechAction } from './kling/text-to-speech';
import { klingTextToVideoAction } from './kling/text-to-video';
import { klingVideoToAudioAction } from './kling/video-to-audio';
import { midjourneyActionAction } from './midjourney/action';
import { midjourneyBlendAction } from './midjourney/blend';
import { midjourneyCreateVideoAction } from './midjourney/create-video';
import { midjourneyDescribeAction } from './midjourney/describe';
import { midjourneyEditImageAction } from './midjourney/edit-image';
import { midjourneyGetTaskAction } from './midjourney/get-task';
import { midjourneyImagineAction } from './midjourney/imagine';
import { midjourneyListTasksAction } from './midjourney/list-tasks';
import { midjourneyModalAction } from './midjourney/modal';
import { runwayCharacterPerformanceAction } from './runway/character-performance';
import { runwayDubVoiceAction } from './runway/dub-voice';
import { runwayGenerateSoundEffectAction } from './runway/generate-sound-effect';
import { runwayGetTaskAction } from './runway/get-task';
import { runwayImageToVideoAction } from './runway/image-to-video';
import { runwayIsolateVoiceAction } from './runway/isolate-voice';
import { runwaySpeechToSpeechAction } from './runway/speech-to-speech';
import { runwayTextToImageAction } from './runway/text-to-image';
import { runwayTextToSpeechAction } from './runway/text-to-speech';
import { runwayTextToVideoAction } from './runway/text-to-video';
import { runwayUpscaleVideoAction } from './runway/upscale-video';
import { runwayVideoToVideoAction } from './runway/video-to-video';
import { getApiKeyUsageAction } from './account/get-api-key-usage';
import { listModelsAction } from './account/list-models';

export const cometApiAiActions = [
  createChatCompletionAction,
  createClaudeMessageAction,
  createEmbeddingsAction,
  createModerationAction,
  createResponseAction,
  geminiGenerateContentAction,
  createSpeechAction,
  createTranscriptionAction,
  createTranslationAction,
  editImageAction,
  fluxGenerateImageAction,
  fluxGetResultAction,
  generateImageAction,
  getImageTaskAction,
  klingCreateOmniImageAction,
  klingExpandImageAction,
  klingGenerateImageAction,
  klingGetOmniImageAction,
  klingMultiImageToImageAction,
  klingVirtualTryOnAction,
  replicateCreatePredictionAction,
  replicateGetPredictionAction,
  createVideoAction,
  downloadVideoAction,
  getVideoAction,
  grokEditVideoAction,
  grokGenerateVideoAction,
  grokGetVideoAction,
  minimaxCreateVideoAction,
  minimaxGetFileAction,
  minimaxGetVideoTaskAction,
  klingAddVideoSelectionAction,
  klingApplyVideoEffectAction,
  klingClearVideoSelectionAction,
  klingCreateAvatarVideoAction,
  klingCreateLipSyncAction,
  klingCreateMultiElementVideoAction,
  klingCreateOmniVideoAction,
  klingDeleteVideoSelectionAction,
  klingExtendVideoAction,
  klingGetOmniVideoAction,
  klingGetTaskAction,
  klingIdentifyFaceAction,
  klingImageToVideoAction,
  klingInitVideoSelectionAction,
  klingMotionControlAction,
  klingMultiImageToVideoAction,
  klingPreviewVideoSelectionAction,
  klingRecognizeImageAction,
  klingRouteGetTasksAction,
  klingRouteImageToVideoAction,
  klingRouteMotionControlAction,
  klingRouteOmniVideoAction,
  klingRouteTextToVideoAction,
  klingTextToAudioAction,
  klingTextToSpeechAction,
  klingTextToVideoAction,
  klingVideoToAudioAction,
  midjourneyActionAction,
  midjourneyBlendAction,
  midjourneyCreateVideoAction,
  midjourneyDescribeAction,
  midjourneyEditImageAction,
  midjourneyGetTaskAction,
  midjourneyImagineAction,
  midjourneyListTasksAction,
  midjourneyModalAction,
  runwayCharacterPerformanceAction,
  runwayDubVoiceAction,
  runwayGenerateSoundEffectAction,
  runwayGetTaskAction,
  runwayImageToVideoAction,
  runwayIsolateVoiceAction,
  runwaySpeechToSpeechAction,
  runwayTextToImageAction,
  runwayTextToSpeechAction,
  runwayTextToVideoAction,
  runwayUpscaleVideoAction,
  runwayVideoToVideoAction,
  getApiKeyUsageAction,
  listModelsAction,
];
