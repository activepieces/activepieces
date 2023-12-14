import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { stellarCreateAccount } from "./lib/actions/stellar-create-account";
import { stellarFundAccount } from "./lib/actions/stellar-fund-account";
import { stellarMergeAccount } from "./lib/actions/stellar-merge-accounts";
import { stellarBuildTransaction } from "./lib/actions/stellar-build-transaction";
import { stellarSignTransaction } from "./lib/actions/stellar-sign-transaction";

export const storage = createPiece({
    displayName: 'Stellar',
    description: "Make operations in Stellar Network",
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbaTQsIwEbKEUSeGbx_LFqVLwSD5XFr351TWl8JKzZpg&s',
    auth: PieceAuth.None(),
    actions: [stellarCreateAccount, stellarFundAccount, stellarMergeAccount, stellarBuildTransaction,  stellarSignTransaction],
    triggers: [],
});
