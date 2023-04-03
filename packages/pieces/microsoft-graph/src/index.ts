import packageJson from "../package.json"

import { createPiece } from "@activepieces/framework"
import { microsoftTeamsSendChannelMessage } from "./lib/actions/microsoft-teams/send-channel-message"

export const microsoftTeams = createPiece({
  name: "microsoft-graph",
  displayName: "Microsoft Graph",
  logoUrl: "https://learn.microsoft.com/en-us/graph/images/hub/icon04-graphtoolkit.svg",
  version: packageJson.version,
  authors: [],
  actions: [microsoftTeamsSendChannelMessage],
  triggers: []
})
