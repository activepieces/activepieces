import { createPiece } from '@activepieces/pieces-framework';
import { airtopAuth } from './lib/common/auth';
import { takeScreenshot } from './lib/actions/take-screenshot';
import { createSession } from './lib/actions/create-session';
import { createNewBrowserWindow } from './lib/actions/create-new-browser-window';
import { terminateSession } from './lib/actions/terminate-session';
import { pageQuery } from './lib/actions/page-query';
import { smartScrape } from './lib/actions/smart-scrape';
import { paginatedExtraction } from './lib/actions/paginated-extraction';
import { clickElement } from './lib/actions/click-element';
import { type } from './lib/actions/type';
import { uploadFile } from './lib/actions/upload-file';
import { hoverElement } from './lib/actions/hover-element';

export const airtop = createPiece({
  displayName: 'Airtop',
  auth: airtopAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/airtop.png',
  authors: ['Sanket6652'],
  actions: [
    createSession,
    createNewBrowserWindow,
    takeScreenshot,
    pageQuery,
    smartScrape,
    paginatedExtraction,
    clickElement,
    type,
    uploadFile,
    hoverElement,
    terminateSession,
  ],
  triggers: [],
});
