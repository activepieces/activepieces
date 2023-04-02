
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { surveyMonkeyTriggers } from "./lib/triggers";

export const surveymonkey = createPiece({
  name: "surveymonkey",
  displayName: "Surveymonkey",
  logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/SurveyMonkey_Logo.svg",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: surveyMonkeyTriggers,
});
