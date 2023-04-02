
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { eventbriteTriggers } from "./lib/triggers";

export const eventbrite = createPiece({
  name: "eventbrite",
  displayName: "Eventbrite",
  logoUrl: "https://www.eventbrite.com/blog/wp-content/uploads/files/2016/01/Eventbrite_logo_blog1.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: eventbriteTriggers,
});
