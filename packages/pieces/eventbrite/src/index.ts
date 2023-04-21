
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { eventbriteTriggers } from "./lib/triggers";

export const eventbrite = createPiece({
  name: "eventbrite",
  displayName: "Eventbrite",
  logoUrl: "https://cdn.evbstatic.com/s3-s3/static/images/support_site/support_about_us/eventbrite_logo.jpg",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: eventbriteTriggers,
});
