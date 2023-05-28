
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

import actions from "./lib/actions";

export const clockodo = createPiece({
  name: "clockodo",
  displayName: "Clockodo",
  logoUrl: "https://play-lh.googleusercontent.com/LA9-rtB-09fZ9DTYXOhWB0Nf3rjky-4kp-nKcBT4SlPgIxYR8efjCYN3tcNj_viRwP-T=w480-h960-rw",
  version: packageJson.version,
  authors: [],
  actions,
  triggers: [],
});
