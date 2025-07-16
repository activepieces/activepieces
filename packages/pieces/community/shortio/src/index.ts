import { createPiece, PieceAuth } from "@activepieces/pieces-framework"
import { shortioAuth } from "./lib/common"
import { newLinkCreated } from "./lib/triggers/new-link-created"
import { createShortLink } from "./lib/actions/create-link"
import { updateLink } from "./lib/actions/update-link"
import { deleteLink } from "./lib/actions/delete-link"
import { expireLink } from "./lib/actions/expire-link"
import { createCountryTargetingForALink } from "./lib/actions/create-country-targeting-for-a-link"
import { getLinkByPath } from "./lib/actions/get-link-by-path"
import { listLinks } from "./lib/actions/list-links"
import { domainStatistics } from "./lib/actions/domain-statistics"
import { getLinkClicks } from "./lib/actions/get-link-clicks"

export const shortio = createPiece({
  displayName: "Shortio",
  auth: shortioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/shortio.png",
  authors: [],
  actions: [createShortLink, updateLink, deleteLink, expireLink, createCountryTargetingForALink, getLinkByPath, listLinks, domainStatistics, getLinkClicks],
  triggers: [newLinkCreated],
});
