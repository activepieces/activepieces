import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { elevenlabsAuth } from './lib/auth';
import { textToSpeech } from './lib/actions/text-to-speech-action';
import { addPronunciationRules } from './lib/actions/ai/add-pronunciation-rules';
import { calculateAgentLlmUsage } from './lib/actions/ai/calculate-agent-llm-usage';
import { calculateLlmUsage } from './lib/actions/ai/calculate-llm-usage';
import { convertSpeechToSpeech } from './lib/actions/ai/convert-speech-to-speech';
import { createAgentTest } from './lib/actions/ai/create-agent-test';
import { createAgent } from './lib/actions/ai/create-agent';
import { createAudioNativeProject } from './lib/actions/ai/create-audio-native-project';
import { createDubbing } from './lib/actions/ai/create-dubbing';
import { createKbFileDocument } from './lib/actions/ai/create-kb-file-document';
import { createKbFolder } from './lib/actions/ai/create-kb-folder';
import { createKbRagIndex } from './lib/actions/ai/create-kb-rag-index';
import { createKbTextDocument } from './lib/actions/ai/create-kb-text-document';
import { createKbUrlDocument } from './lib/actions/ai/create-kb-url-document';
import { createPronunciationDictionaryFromFile } from './lib/actions/ai/create-pronunciation-dictionary-from-file';
import { createPronunciationDictionaryFromRules } from './lib/actions/ai/create-pronunciation-dictionary-from-rules';
import { createSecret } from './lib/actions/ai/create-secret';
import { createTool } from './lib/actions/ai/create-tool';
import { deleteDubbing } from './lib/actions/ai/delete-dubbing';
import { deleteKbDocument } from './lib/actions/ai/delete-kb-document';
import { deleteKbRagIndex } from './lib/actions/ai/delete-kb-rag-index';
import { deleteSecret } from './lib/actions/ai/delete-secret';
import { deleteTool } from './lib/actions/ai/delete-tool';
import { downloadHistoryItems } from './lib/actions/ai/download-history-items';
import { duplicateAgent } from './lib/actions/ai/duplicate-agent';
import { findSimilarVoices } from './lib/actions/ai/find-similar-voices';
import { getAgentKnowledgeBaseSize } from './lib/actions/ai/get-agent-knowledge-base-size';
import { getAgentLink } from './lib/actions/ai/get-agent-link';
import { getAgentTestSummaries } from './lib/actions/ai/get-agent-test-summaries';
import { getAgentTest } from './lib/actions/ai/get-agent-test';
import { getAgentWidget } from './lib/actions/ai/get-agent-widget';
import { getAgent } from './lib/actions/ai/get-agent';
import { getAudioNativeSettings } from './lib/actions/ai/get-audio-native-settings';
import { getConversationSignedUrl } from './lib/actions/ai/get-conversation-signed-url';
import { getDefaultVoiceSettings } from './lib/actions/ai/get-default-voice-settings';
import { getDubbedFile } from './lib/actions/ai/get-dubbed-file';
import { getDubbingTranscriptFormatted } from './lib/actions/ai/get-dubbing-transcript-formatted';
import { getDubbingTranscript } from './lib/actions/ai/get-dubbing-transcript';
import { getDubbing } from './lib/actions/ai/get-dubbing';
import { getHistoryItemAudio } from './lib/actions/ai/get-history-item-audio';
import { getHistoryItem } from './lib/actions/ai/get-history-item';
import { getKbDocumentContent } from './lib/actions/ai/get-kb-document-content';
import { getKbDocumentRagIndexes } from './lib/actions/ai/get-kb-document-rag-indexes';
import { getKbDocumentSourceUrl } from './lib/actions/ai/get-kb-document-source-url';
import { getKbDocument } from './lib/actions/ai/get-kb-document';
import { getKbRagIndexOverview } from './lib/actions/ai/get-kb-rag-index-overview';
import { getKbSummaries } from './lib/actions/ai/get-kb-summaries';
import { getLiveConversationCount } from './lib/actions/ai/get-live-conversation-count';
import { getPronunciationDictionaryVersion } from './lib/actions/ai/get-pronunciation-dictionary-version';
import { getPronunciationDictionary } from './lib/actions/ai/get-pronunciation-dictionary';
import { getSubscription } from './lib/actions/ai/get-subscription';
import { getTestInvocation } from './lib/actions/ai/get-test-invocation';
import { getTool } from './lib/actions/ai/get-tool';
import { getUser } from './lib/actions/ai/get-user';
import { getVoiceSettings } from './lib/actions/ai/get-voice-settings';
import { getVoice } from './lib/actions/ai/get-voice';
import { isolateAudio } from './lib/actions/ai/isolate-audio';
import { listAgentTests } from './lib/actions/ai/list-agent-tests';
import { listAgents } from './lib/actions/ai/list-agents';
import { listBatchCalls } from './lib/actions/ai/list-batch-calls';
import { listConversations } from './lib/actions/ai/list-conversations';
import { listDubbings } from './lib/actions/ai/list-dubbings';
import { listHistoryItems } from './lib/actions/ai/list-history-items';
import { listKbDependentAgents } from './lib/actions/ai/list-kb-dependent-agents';
import { listKbDocuments } from './lib/actions/ai/list-kb-documents';
import { listModels } from './lib/actions/ai/list-models';
import { listPhoneNumbers } from './lib/actions/ai/list-phone-numbers';
import { listPronunciationDictionaries } from './lib/actions/ai/list-pronunciation-dictionaries';
import { listSecrets } from './lib/actions/ai/list-secrets';
import { listSharedVoices } from './lib/actions/ai/list-shared-voices';
import { listTestInvocations } from './lib/actions/ai/list-test-invocations';
import { listToolDependentAgents } from './lib/actions/ai/list-tool-dependent-agents';
import { listTools } from './lib/actions/ai/list-tools';
import { listVoices } from './lib/actions/ai/list-voices';
import { moveKbDocument } from './lib/actions/ai/move-kb-document';
import { moveKbDocumentsBulk } from './lib/actions/ai/move-kb-documents-bulk';
import { removePronunciationRules } from './lib/actions/ai/remove-pronunciation-rules';
import { resubmitTestInvocation } from './lib/actions/ai/resubmit-test-invocation';
import { runAgentTests } from './lib/actions/ai/run-agent-tests';
import { setAgentAvatar } from './lib/actions/ai/set-agent-avatar';
import { simulateAgentConversation } from './lib/actions/ai/simulate-agent-conversation';
import { updateAgentTest } from './lib/actions/ai/update-agent-test';
import { updateAgent } from './lib/actions/ai/update-agent';
import { updateAudioNativeContent } from './lib/actions/ai/update-audio-native-content';
import { updateKbDocument } from './lib/actions/ai/update-kb-document';
import { updatePronunciationDictionary } from './lib/actions/ai/update-pronunciation-dictionary';
import { updateSecret } from './lib/actions/ai/update-secret';
import { updateTool } from './lib/actions/ai/update-tool';
import { getApiKey, getRegionApiUrl } from './lib/common';

const customApiCallDescription = `
Check [Elevenlabs API reference](https://elevenlabs.io/docs/api-reference/introduction)
for the list of available endpoints.
`

export const elevenlabs = createPiece({
  displayName: 'ElevenLabs',
  auth: elevenlabsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/elevenlabs.png',
  authors: ['pfernandez98'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'AI Voice Generator & Text to Speech',
  actions: [
    textToSpeech,
    addPronunciationRules,
    calculateAgentLlmUsage,
    calculateLlmUsage,
    convertSpeechToSpeech,
    createAgentTest,
    createAgent,
    createAudioNativeProject,
    createDubbing,
    createKbFileDocument,
    createKbFolder,
    createKbRagIndex,
    createKbTextDocument,
    createKbUrlDocument,
    createPronunciationDictionaryFromFile,
    createPronunciationDictionaryFromRules,
    createSecret,
    createTool,
    deleteDubbing,
    deleteKbDocument,
    deleteKbRagIndex,
    deleteSecret,
    deleteTool,
    downloadHistoryItems,
    duplicateAgent,
    findSimilarVoices,
    getAgentKnowledgeBaseSize,
    getAgentLink,
    getAgentTestSummaries,
    getAgentTest,
    getAgentWidget,
    getAgent,
    getAudioNativeSettings,
    getConversationSignedUrl,
    getDefaultVoiceSettings,
    getDubbedFile,
    getDubbingTranscriptFormatted,
    getDubbingTranscript,
    getDubbing,
    getHistoryItemAudio,
    getHistoryItem,
    getKbDocumentContent,
    getKbDocumentRagIndexes,
    getKbDocumentSourceUrl,
    getKbDocument,
    getKbRagIndexOverview,
    getKbSummaries,
    getLiveConversationCount,
    getPronunciationDictionaryVersion,
    getPronunciationDictionary,
    getSubscription,
    getTestInvocation,
    getTool,
    getUser,
    getVoiceSettings,
    getVoice,
    isolateAudio,
    listAgentTests,
    listAgents,
    listBatchCalls,
    listConversations,
    listDubbings,
    listHistoryItems,
    listKbDependentAgents,
    listKbDocuments,
    listModels,
    listPhoneNumbers,
    listPronunciationDictionaries,
    listSecrets,
    listSharedVoices,
    listTestInvocations,
    listToolDependentAgents,
    listTools,
    listVoices,
    moveKbDocument,
    moveKbDocumentsBulk,
    removePronunciationRules,
    resubmitTestInvocation,
    runAgentTests,
    setAgentAvatar,
    simulateAgentConversation,
    updateAgentTest,
    updateAgent,
    updateAudioNativeContent,
    updateKbDocument,
    updatePronunciationDictionary,
    updateSecret,
    updateTool,
    createCustomApiCallAction({
      // it would be more useful to have hint for URL
      description: customApiCallDescription,
      // missing propsValue to not override url when credentials are changed
      // @see packages/pieces/common/src/lib/helpers/index.ts:65
      baseUrl: (auth) => {
        return getRegionApiUrl(auth?.props.region)
      },
      auth: elevenlabsAuth,
      authMapping: async (auth) => {
        return ({
          // keep old plain value for bc
          'xi-api-key': `${getApiKey(auth.props.apiKey)}`,
        })
      },
    }),
  ],
  triggers: [],
});

export { elevenlabsAuth };
