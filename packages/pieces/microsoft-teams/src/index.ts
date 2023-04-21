import packageJson from "../package.json"

import { createPiece } from "@activepieces/framework"
import { microsoftTeamsSendChannelMessage } from "./lib/actions/send-channel-message"

export const microsoftTeams = createPiece({
  name: "microsoft-teams",
  displayName: "Microsoft Teams",
  logoUrl: "https://logodownload.org/wp-content/uploads/2021/08/microsoft-teams-logo-0.png",
  version: packageJson.version,
  authors: [],
  actions: [microsoftTeamsSendChannelMessage],
  triggers: []
})
