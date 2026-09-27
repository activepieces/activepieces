import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import {
  createApp,
  editAppWithAi,
  findApp,
  generateImage,
  getApp,
  getChatHistory,
  getPublishStatus,
  getScreenshot,
  listApps,
  publishApp,
  renameApp,
  wakeApp,
} from './lib/actions/apps';
import { deleteRows, findRows, getDatabaseSchema, insertRows, runSql, updateRows } from './lib/actions/database';
import { buyDomain, checkDomain, connectDomain, searchDomains } from './lib/actions/domains';
import { deleteFiles, editFile, listFiles, readFiles, writeFile } from './lib/actions/files';
import {
  connectSearchConsole,
  getAnalytics,
  getCredits,
  getSearchConsole,
  listFormSubmissions,
} from './lib/actions/insights';
import { getTask, retryTask } from './lib/actions/tasks';
import { kleapAuth } from './lib/auth';
import { apiKeyOf, KLEAP_API_BASE_URL, KLEAP_USER_AGENT } from './lib/common/client';
import { newApp, newDatabaseRow, newFormSubmission } from './lib/triggers';

export { kleapAuth } from './lib/auth';

export const kleap = createPiece({
  displayName: 'Kleap',
  description:
    'AI builder for websites, web apps and internal tools. Create, edit and publish sites with AI, read their leads, analytics and database, and buy domains.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://kleap.co/icon.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.MARKETING, PieceCategory.DEVELOPER_TOOLS],
  authors: ['kleap'],
  auth: kleapAuth,
  actions: [
    createApp,
    editAppWithAi,
    getTask,
    retryTask,
    publishApp,
    getPublishStatus,
    getApp,
    listApps,
    findApp,
    renameApp,
    wakeApp,
    getScreenshot,
    getChatHistory,
    generateImage,
    listFiles,
    readFiles,
    writeFile,
    editFile,
    deleteFiles,
    listFormSubmissions,
    getAnalytics,
    getSearchConsole,
    connectSearchConsole,
    getCredits,
    searchDomains,
    checkDomain,
    connectDomain,
    buyDomain,
    getDatabaseSchema,
    findRows,
    insertRows,
    updateRows,
    deleteRows,
    runSql,
    createCustomApiCallAction({
      auth: kleapAuth,
      baseUrl: () => KLEAP_API_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${apiKeyOf(auth)}`,
        'User-Agent': KLEAP_USER_AGENT,
      }),
    }),
  ],
  triggers: [newFormSubmission, newApp, newDatabaseRow],
});
