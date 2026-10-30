import { cancelAgentResponseAction } from './agent/cancel-agent-response';
import { createAgentResponseAction } from './agent/create-agent-response';
import { downloadAgentResponseFileAction } from './agent/download-agent-response-file';
import { getAgentResponseAction } from './agent/get-agent-response';
import { listAgentResponseFilesAction } from './agent/list-agent-response-files';
import { listModelsAction } from './agent/list-models';
import { cancelBatchAction } from './batches/cancel-batch';
import { createBatchAction } from './batches/create-batch';
import { deleteFileAction } from './batches/delete-file';
import { downloadFileContentAction } from './batches/download-file-content';
import { getBatchAction } from './batches/get-batch';
import { getFileAction } from './batches/get-file';
import { listBatchesAction } from './batches/list-batches';
import { listFilesAction } from './batches/list-files';
import { uploadFileAction } from './batches/upload-file';
import { evaluateDecisionsAction } from './decisions/evaluate-decisions';
import { createContextualizedEmbeddingsAction } from './embeddings/create-contextualized-embeddings';
import { createEmbeddingsAction } from './embeddings/create-embeddings';
import { searchWebAction } from './search/search-web';
import { createSkillAction } from './skills/create-skill';
import { deleteSkillAction } from './skills/delete-skill';
import { getSkillAction } from './skills/get-skill';
import { getSkillDownloadUrlAction } from './skills/get-skill-download-url';
import { listSkillRevisionsAction } from './skills/list-skill-revisions';
import { listSkillsAction } from './skills/list-skills';
import { updateSkillAction } from './skills/update-skill';

export const perplexityAiAiActions = [
  cancelAgentResponseAction,
  createAgentResponseAction,
  downloadAgentResponseFileAction,
  getAgentResponseAction,
  listAgentResponseFilesAction,
  listModelsAction,
  searchWebAction,
  createContextualizedEmbeddingsAction,
  createEmbeddingsAction,
  evaluateDecisionsAction,
  createSkillAction,
  deleteSkillAction,
  getSkillAction,
  getSkillDownloadUrlAction,
  listSkillRevisionsAction,
  listSkillsAction,
  updateSkillAction,
  cancelBatchAction,
  createBatchAction,
  deleteFileAction,
  downloadFileContentAction,
  getBatchAction,
  getFileAction,
  listBatchesAction,
  listFilesAction,
  uploadFileAction,
];
