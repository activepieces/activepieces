
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import {
      newFormEntry,
      newForm,
      createFormEntry,
      findForm,
      getEntryDetails,
      findSubmissionByFieldValue,
    } from "./lib";

    export const wufoo = createPiece({
      displayName: "Wufoo",
      auth: PieceAuth.SecretText({
        displayName: 'API Key',
        required: true,
        description: 'Your Wufoo API Key',
      }),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/wufoo.png",
      authors: [],
      actions: [
        createFormEntry,
        findForm,
        getEntryDetails,
        findSubmissionByFieldValue,
      ],
      triggers: [
        newFormEntry,
        newForm,
      ],
    });
    