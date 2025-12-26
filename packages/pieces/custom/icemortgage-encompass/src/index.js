"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.icemortgageEncompassAuth = exports.icemortgageEncompass = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
var shared_1 = require("@activepieces/shared");
var pieces_common_1 = require("@activepieces/pieces-common");
var auth_1 = require("./lib/common/auth");
Object.defineProperty(exports, "icemortgageEncompassAuth", { enumerable: true, get: function () { return auth_1.icemortgageEncompassAuth; } });
var create_loan_1 = require("./lib/actions/create-loan");
var retrieve_loan_1 = require("./lib/actions/retrieve-loan");
var update_loan_1 = require("./lib/actions/update-loan");
var delete_loan_1 = require("./lib/actions/delete-loan");
var manage_field_locks_1 = require("./lib/actions/manage-field-locks");
var document_create_1 = require("./lib/actions/document-create");
var document_retrieve_1 = require("./lib/actions/document-retrieve");
var document_list_1 = require("./lib/actions/document-list");
var document_update_1 = require("./lib/actions/document-update");
var document_add_comments_1 = require("./lib/actions/document-add-comments");
var document_assign_attachments_1 = require("./lib/actions/document-assign-attachments");
exports.icemortgageEncompass = (0, pieces_framework_1.createPiece)({
    displayName: 'IceMortgage Encompass',
    auth: auth_1.icemortgageEncompassAuth,
    minimumSupportedRelease: '0.20.0',
    logoUrl: 'https://i.imgur.com/UqqkpPQ.png',
    authors: ['vqnguyen1'],
    categories: [shared_1.PieceCategory.BUSINESS_INTELLIGENCE],
    actions: [
        create_loan_1.createLoan,
        retrieve_loan_1.retrieveLoan,
        update_loan_1.updateLoan,
        delete_loan_1.deleteLoan,
        manage_field_locks_1.manageFieldLocks,
        document_create_1.createDocument,
        document_retrieve_1.retrieveDocument,
        document_list_1.listDocuments,
        document_update_1.updateDocument,
        document_add_comments_1.addDocumentComments,
        document_assign_attachments_1.assignDocumentAttachments,
        (0, pieces_common_1.createCustomApiCallAction)({
            baseUrl: function (auth) { return auth.baseUrl || 'https://api.elliemae.com'; },
            auth: auth_1.icemortgageEncompassAuth,
            authMapping: function (auth) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // Note: Encompass uses OAuth2, this is a simplified version
                    // In production, you'd need to handle token refresh
                    return [2 /*return*/, {
                            'Authorization': "Bearer ".concat(auth.clientSecret),
                            'Content-Type': 'application/json',
                        }];
                });
            }); },
        }),
    ],
    triggers: [],
});
