
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { surveyMonkeyTriggers } from "./lib/triggers";

export const surveymonkey = createPiece({
  name: "surveymonkey",
  displayName: "Surveymonkey",
  logoUrl: "https://play-lh.googleusercontent.com/QBR4_b0G2bXWnNx8WOOL-3XmSC6yLkBrX8IuAM6Jpq_aDTnB3crN8GI0bdIp1eJPrW8",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: surveyMonkeyTriggers,
});
