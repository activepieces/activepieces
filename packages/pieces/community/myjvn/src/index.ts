
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getAlertList } from "./lib/actions/get-alertlist";
import { getVendorList } from "./lib/actions/get-vendorlist";
import { getProductList } from "./lib/actions/get-productlist";
import { getVulnOverviewList } from "./lib/actions/get-vulnoverviewlist";
import { getVulnDetailInfo } from "./lib/actions/get-vulnDetailInfo";

export const myjvn = createPiece({
  displayName: "MyJVN",
  description: 'Information on vulnerabilities and countermeasures for software used in Japan, provided through the MyJVN API.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/myjvn.png",
  authors: ["hijiriishi"],
  actions: [
    getAlertList,
    getVendorList,
    getProductList,
    getVulnOverviewList,
    getVulnDetailInfo,
  ],
  triggers: [],
});
