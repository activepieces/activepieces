"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fiserv = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
var shared_1 = require("@activepieces/shared");
var auth_1 = require("./lib/common/auth");
// Party actions
var create_party_1 = require("./lib/actions/parties/create-party");
var get_party_1 = require("./lib/actions/parties/get-party");
var update_party_1 = require("./lib/actions/parties/update-party");
// Account actions
var create_account_1 = require("./lib/actions/accounts/create-account");
var get_account_1 = require("./lib/actions/accounts/get-account");
var update_account_1 = require("./lib/actions/accounts/update-account");
// Loan actions - Collateral
var add_collateral_1 = require("./lib/actions/loans/collateral/add-collateral");
var get_collateral_1 = require("./lib/actions/loans/collateral/get-collateral");
var update_collateral_1 = require("./lib/actions/loans/collateral/update-collateral");
var delete_collateral_1 = require("./lib/actions/loans/collateral/delete-collateral");
// Loan actions - Escrow
var add_escrow_1 = require("./lib/actions/loans/escrow/add-escrow");
var get_escrow_1 = require("./lib/actions/loans/escrow/get-escrow");
var update_escrow_1 = require("./lib/actions/loans/escrow/update-escrow");
var delete_escrow_1 = require("./lib/actions/loans/escrow/delete-escrow");
exports.fiserv = (0, pieces_framework_1.createPiece)({
    displayName: 'Fiserv',
    auth: auth_1.fiservAuth,
    minimumSupportedRelease: '0.20.0',
    logoUrl: 'logo.png',
    authors: ['vqnguyen1'],
    categories: [shared_1.PieceCategory.BUSINESS_INTELLIGENCE],
    actions: [
        // Party actions (3)
        create_party_1.createParty,
        get_party_1.getParty,
        update_party_1.updateParty,
        // Account actions (3)
        create_account_1.createAccount,
        get_account_1.getAccount,
        update_account_1.updateAccount,
        // Loan actions - Collateral (4)
        add_collateral_1.addCollateral,
        get_collateral_1.getCollateral,
        update_collateral_1.updateCollateral,
        delete_collateral_1.deleteCollateral,
        // Loan actions - Escrow (4)
        add_escrow_1.addEscrow,
        get_escrow_1.getEscrow,
        update_escrow_1.updateEscrow,
        delete_escrow_1.deleteEscrow,
    ],
    triggers: [],
});
