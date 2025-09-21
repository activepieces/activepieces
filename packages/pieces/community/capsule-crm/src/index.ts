
    import { createPiece } from "@activepieces/pieces-framework";
    import { capsuleCrmAuth } from "../src/lib/common/auth";
    import { createContactAction } from "../src/lib/actions/create-contact";
    import { updateContactAction } from "../src/lib/actions/update-contact";

    export const capsuleCrm = createPiece({
      displayName: 'Capsule-crm',
      auth: capsuleCrmAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/capsule-crm.png',
      authors: ['Prabhukiran161'],
      actions: [createContactAction, updateContactAction],
      triggers: [],
    });
    