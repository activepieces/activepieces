import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { documentQuestionAnswering } from './lib/actions/document-question-answering';
import { languageTranslation } from './lib/actions/language-translation';
import { textClassification } from './lib/actions/text-classification';
import { textSummarization } from './lib/actions/text-summarization';
import { chatCompletion } from './lib/actions/chat-completion';
import { createImage } from './lib/actions/create-image';
import { objectDetection } from './lib/actions/object-detection';
import { imageClassification } from './lib/actions/image-classification';
import { searchModels } from './lib/actions/search-models';
import { searchDatasets } from './lib/actions/search-datasets';
import { searchSpaces } from './lib/actions/search-spaces';
import { getModel } from './lib/actions/get-model';
import { getDataset } from './lib/actions/get-dataset';
import { getSpace } from './lib/actions/get-space';
import { listTrendingRepos } from './lib/actions/list-trending-repos';
import { listHubTags } from './lib/actions/list-hub-tags';
import { listRepoFiles } from './lib/actions/list-repo-files';
import { getRepoPathsInfo } from './lib/actions/get-repo-paths-info';
import { readRepoFile } from './lib/actions/read-repo-file';
import { listRepoCommits } from './lib/actions/list-repo-commits';
import { listRepoRefs } from './lib/actions/list-repo-refs';
import { compareRepoRevisions } from './lib/actions/compare-repo-revisions';
import { getRepoSize } from './lib/actions/get-repo-size';
import { getRepoSecurityScan } from './lib/actions/get-repo-security-scan';
import { getCurrentUser } from './lib/actions/get-current-user';
import { getUserOverview } from './lib/actions/get-user-overview';
import { getOrganizationOverview } from './lib/actions/get-organization-overview';
import { listOrganizationMembers } from './lib/actions/list-organization-members';
import { listDiscussions } from './lib/actions/list-discussions';
import { getDiscussion } from './lib/actions/get-discussion';
import { listDailyPapers } from './lib/actions/list-daily-papers';
import { searchPapers } from './lib/actions/search-papers';
import { getPaper } from './lib/actions/get-paper';
import { listCollections } from './lib/actions/list-collections';
import { getCollection } from './lib/actions/get-collection';
import { generateChatCompletion } from './lib/actions/generate-chat-completion';
import { generateEmbeddings } from './lib/actions/generate-embeddings';
import { huggingFaceAuth } from './lib/auth';

export const huggingface = createPiece({
  displayName: 'Hugging Face',
  description:
    'Run inference on 100,000+ open ML models for NLP, vision, and audio tasks',
  auth: huggingFaceAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/huggingface.svg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['Ani-4x'],
  actions: [
    documentQuestionAnswering,
    languageTranslation,
    textClassification,
    textSummarization,
    chatCompletion,
    createImage,
    objectDetection,
    imageClassification,
    searchModels,
    searchDatasets,
    searchSpaces,
    getModel,
    getDataset,
    getSpace,
    listTrendingRepos,
    listHubTags,
    listRepoFiles,
    getRepoPathsInfo,
    readRepoFile,
    listRepoCommits,
    listRepoRefs,
    compareRepoRevisions,
    getRepoSize,
    getRepoSecurityScan,
    getCurrentUser,
    getUserOverview,
    getOrganizationOverview,
    listOrganizationMembers,
    listDiscussions,
    getDiscussion,
    listDailyPapers,
    searchPapers,
    getPaper,
    listCollections,
    getCollection,
    generateChatCompletion,
    generateEmbeddings,
  ],
  triggers: [],
});
