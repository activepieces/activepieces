
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { clickFunnelTriggers } from "./lib/triggers"

export const clickfunnels = createPiece({
  name: "clickfunnels",
  displayName: "Clickfunnels",
  logoUrl: "https://seeklogo.com/images/C/clickfunnels-logo-660D51E840-seeklogo.com.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: clickFunnelTriggers,
});
