import { createPiece, PieceAuth, Property ,PiecePropValueSchema, Piece} from "@activepieces/pieces-framework";
import { getPageContent } from "./lib/actions/get-page-content";
import { newPageTrigger } from "./lib/triggers/new-page";
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { createPageFromTemplateAction } from "./lib/actions/create-page-from-template";
import { confluenceAuth } from './lib/auth';

export const confluence = createPiece({
  displayName: "Confluence",
  auth: confluenceAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/confluence.png",
  authors: ["geekyme"],
  actions: [getPageContent,createPageFromTemplateAction,
    createCustomApiCallAction({
      baseUrl:(auth)=>{
        return `${ auth?.props.confluenceDomain?? ''}/wiki/api/v2`;
      },
      auth: confluenceAuth,
      authMapping: async (auth) => {
        const authValue = auth.props
        return {
          Authorization: `Basic ${Buffer.from(`${authValue.username}:${authValue.password}`).toString('base64')}`,
        };
      },
    })
  ],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [newPageTrigger],
});
