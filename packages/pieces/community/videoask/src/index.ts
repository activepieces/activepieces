
import { createPiece } from "@activepieces/pieces-framework";
import { createContact } from "./lib/actions/create-contact";
import { videoaskAuth } from "./lib/common/auth";
import { createCustomApiCallAction, HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./lib/common/client";
import { PieceCategory } from "@activepieces/shared";
import { formContactMessage } from "./lib/triggers/form-contact-message";
import { formTranscribed } from "./lib/triggers/form-transcribed";
import { newFormResponse } from "./lib/triggers/new-form-response";
import { newFormAuthorResponse } from "./lib/triggers/new-form-author-response";
import { addTagToContact } from "./lib/actions/add-tag-to-contact";
import { removeTagFromContact } from "./lib/actions/remove-tag-from-contact";
import { searchForm } from "./lib/actions/search-form";
import { updateContact } from "./lib/actions/update-contact";

export const videoask = createPiece({
  displayName: "VideoAsk",
  auth: videoaskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/videoask.png",
  authors: ['sanket-a11y'],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [
    addTagToContact,
    createContact,
    removeTagFromContact,
    searchForm,
    updateContact,
    createCustomApiCallAction({
      auth: videoaskAuth,
      baseUrl: () => "https://api.videoask.com",
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
    formContactMessage,
    formTranscribed,
    newFormResponse,
    newFormAuthorResponse
  ],
});
