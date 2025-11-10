
import { createPiece, Piece, Property } from "@activepieces/pieces-framework";
import { createContact } from "./lib/actions/create-contact";
import { videoaskAuth } from "./lib/common/auth";
import { newReplyFromRespondent } from "./lib/triggers/new-reply-from-respondent";
import { newReplyFromVideoasker } from "./lib/triggers/new-reply-from-videoasker";
import { newResponseFormRespondent } from "./lib/triggers/new-response-form-respondent";
import { createCustomApiCallAction, HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./lib/common/client";
import { PieceCategory } from "@activepieces/shared";

export const videoask = createPiece({
  displayName: "Videoask",
  auth: videoaskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/videoask.png",
  authors: ['sanket-a11y'],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    createContact,
    createCustomApiCallAction({
      auth: videoaskAuth,
      baseUrl: () => "https://api.videoask.com/v1",
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as any).access_token}`,
          "Content-Type": "application/json",
          "organization-id": await (async () => {
            const access_token = (auth as any).access_token;
            const organizations = await makeRequest(
              '',
              access_token,
              HttpMethod.GET,
              '/organizations'
            );
            return organizations.results[0].organization_id;
          })(),
        };
      }
    })
  ],
  triggers: [
    newReplyFromRespondent,
    newReplyFromVideoasker,
    newResponseFormRespondent
  ],
});
