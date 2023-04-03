
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { microsoftTeamsSendChannelMessage } from "./lib/actions/send-channel-message";

export const microsoftTeams = createPiece({
  name: "microsoft-teams",
  displayName: "Microsoft-teams",
  logoUrl: "https://play-lh.googleusercontent.com/jKU64njy8urP89V1O63eJxMtvWjDGETPlHVIhDv9WZAYzsSxRWyWZkUlBJZj_HbkHA=w240-h480-rw",
  version: packageJson.version,
  authors: [],
  actions: [microsoftTeamsSendChannelMessage],
  triggers: [],
});
