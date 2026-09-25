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
import { checkDatasetViewerSupport } from './lib/actions/check-dataset-viewer-support';
import { listDatasetSplits } from './lib/actions/list-dataset-splits';
import { previewDatasetRows } from './lib/actions/preview-dataset-rows';
import { getDatasetRows } from './lib/actions/get-dataset-rows';
import { searchDatasetRows } from './lib/actions/search-dataset-rows';
import { filterDatasetRows } from './lib/actions/filter-dataset-rows';
import { getDatasetViewerInfo } from './lib/actions/get-dataset-viewer-info';
import { getDatasetSize } from './lib/actions/get-dataset-size';
import { getDatasetStatistics } from './lib/actions/get-dataset-statistics';
import { listDatasetParquetFiles } from './lib/actions/list-dataset-parquet-files';
import { getDatasetLeaderboard } from './lib/actions/get-dataset-leaderboard';
import { createRepo } from './lib/actions/create-repo';
import { updateRepoSettings } from './lib/actions/update-repo-settings';
import { createRepoBranch } from './lib/actions/create-repo-branch';
import { deleteRepoBranch } from './lib/actions/delete-repo-branch';
import { createRepoTag } from './lib/actions/create-repo-tag';
import { deleteRepoTag } from './lib/actions/delete-repo-tag';
import { commitFiles } from './lib/actions/commit-files';
import { createDiscussion } from './lib/actions/create-discussion';
import { commentOnDiscussion } from './lib/actions/comment-on-discussion';
import { changeDiscussionStatus } from './lib/actions/change-discussion-status';
import { renameDiscussion } from './lib/actions/rename-discussion';
import { pinDiscussion } from './lib/actions/pin-discussion';
import { deleteDiscussion } from './lib/actions/delete-discussion';
import { commentOnPaper } from './lib/actions/comment-on-paper';
import { replyToPaperComment } from './lib/actions/reply-to-paper-comment';
import { createCollection } from './lib/actions/create-collection';
import { addCollectionItem } from './lib/actions/add-collection-item';
import { listGatedAccessRequests } from './lib/actions/list-gated-access-requests';
import { handleGatedAccessRequest } from './lib/actions/handle-gated-access-request';
import { upsertSpaceSecret } from './lib/actions/upsert-space-secret';
import { deleteSpaceSecret } from './lib/actions/delete-space-secret';
import { upsertSpaceVariable } from './lib/actions/upsert-space-variable';
import { deleteSpaceVariable } from './lib/actions/delete-space-variable';
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
    checkDatasetViewerSupport,
    listDatasetSplits,
    previewDatasetRows,
    getDatasetRows,
    searchDatasetRows,
    filterDatasetRows,
    getDatasetViewerInfo,
    getDatasetSize,
    getDatasetStatistics,
    listDatasetParquetFiles,
    getDatasetLeaderboard,
    createRepo,
    updateRepoSettings,
    createRepoBranch,
    deleteRepoBranch,
    createRepoTag,
    deleteRepoTag,
    commitFiles,
    createDiscussion,
    commentOnDiscussion,
    changeDiscussionStatus,
    renameDiscussion,
    pinDiscussion,
    deleteDiscussion,
    commentOnPaper,
    replyToPaperComment,
    createCollection,
    addCollectionItem,
    listGatedAccessRequests,
    handleGatedAccessRequest,
    upsertSpaceSecret,
    deleteSpaceSecret,
    upsertSpaceVariable,
    deleteSpaceVariable,
  ],
  triggers: [],
});
