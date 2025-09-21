
    import { createPiece } from "@activepieces/pieces-framework";
    import { whatConvertsAuth } from "../src/lib/common/auth";
    import { createLeadAction } from '../src/lib/actions/create-lead';
    import { createExportAction } from '../src/lib/actions/create-export';
    import { updateLeadAction } from '../src/lib/actions/update-lead';
    import { findLeadAction } from '../src/lib/actions/find-lead';
    import { newLeadTrigger } from '../src/lib/triggers/new-lead';
    import { updatedLeadTrigger } from '../src/lib/triggers/updated-lead';

    export const whatConverts = createPiece({
      displayName: 'What-converts',
      auth: whatConvertsAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/what-converts.png',
      authors: ['Prabhukiran161'],
      actions: [
        createLeadAction,
        createExportAction,
        updateLeadAction,
        findLeadAction,
      ],
      triggers: [newLeadTrigger, updatedLeadTrigger],
    });
    