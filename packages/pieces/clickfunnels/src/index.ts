
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { clickFunnelTriggers } from "./lib/triggers"

export const clickfunnels = createPiece({
  name: "clickfunnels",
  displayName: "Clickfunnels",
  logoUrl: "https://statics.myclickfunnels.com/image/18323/file/6878b605c266ff9e27a89ea5d0e7ce01.svg",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: clickFunnelTriggers,
});
