
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { sendinBlueCreateContact } from "./lib/actions/create-contact";
import { sendinBlueUpdateContact } from "./lib/actions/update-contact";

export const sendinblue = createPiece({
  name: "sendinblue",
  displayName: "Sendinblue",
  //TODO: Get logos at 
  // - https://www.pngwing.com/en/free-png-aaryr or
  // - https://www.pngwing.com/en/free-png-aaryl
  logoUrl: "https://www.sendinblue.com/wp-content/themes/sendinblue2019/assets/images/common/logo-color.svg",
  version: packageJson.version,
  authors: [],
  actions: [sendinBlueCreateContact, sendinBlueUpdateContact],
  triggers: [],
});
