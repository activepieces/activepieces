import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { testmuaiAuth } from './lib/common/auth';
import { createSession } from './lib/actions/create-session';
import { navigate } from './lib/actions/navigate';
import { snapshotPage } from './lib/actions/snapshot-page';
import { clickElement } from './lib/actions/click-element';
import { typeText } from './lib/actions/type-text';
import { getText } from './lib/actions/get-text';
import { takeScreenshot } from './lib/actions/take-screenshot';
import { executeScript } from './lib/actions/execute-script';
import { releaseSession } from './lib/actions/release-session';

export const testmuaiBrowsercloud = createPiece({
  displayName: 'TestMu AI (Formerly LambdaTest)',
  description:
    'Launch and drive real cloud browsers on TestMu AI (formerly LambdaTest) infrastructure — navigate, snapshot, click, type, read, and screenshot pages. Built for AI agents.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/testmuai-browsercloud.svg',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['harishrajora'],
  auth: testmuaiAuth,
  actions: [
    createSession,
    navigate,
    snapshotPage,
    clickElement,
    typeText,
    getText,
    takeScreenshot,
    executeScript,
    releaseSession,
  ],
  triggers: [],
});
