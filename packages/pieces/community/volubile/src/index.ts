import { createPiece } from '@activepieces/pieces-framework';
import { preCallTrigger } from './lib/triggers/pre-call-trigger';
import { volubileAuth } from './lib/auth';
import { liveCallTrigger } from './lib/triggers/live-call-trigger';
import { postCallTrigger } from './lib/triggers/post-call-trigger';
import { returnContext } from './lib/actions/return-context';



export const volubile = createPiece({
  displayName: "Volubile",
  auth: volubileAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://volubile.blob.core.windows.net/backoffice/assets/activepieces/volubile-icon.svg",
  authors: [],
  actions: [returnContext],
  triggers: [preCallTrigger, liveCallTrigger, postCallTrigger],
});
