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
exports.createAccount = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
var client_1 = require("../../common/client");
var pieces_common_1 = require("@activepieces/pieces-common");
var auth_1 = require("../../common/auth");
var props_1 = require("../../common/props");
var constants_1 = require("../../common/constants");
exports.createAccount = (0, pieces_framework_1.createAction)({
    name: 'account_create',
    displayName: 'Account - Create',
    description: 'Create a new account in Fiserv (deposit or loan)',
    auth: auth_1.fiservAuth,
    props: {
        accountType: props_1.accountTypeProp,
        partyId: props_1.partyIdProp,
        // Common fields
        branchId: pieces_framework_1.Property.ShortText({
            displayName: 'Branch ID',
            description: 'Branch identifier where account is opened',
            required: false,
        }),
        productCode: pieces_framework_1.Property.ShortText({
            displayName: 'Product Code',
            description: 'Product code for the account type',
            required: false,
        }),
        // Deposit account fields
        openingBalance: pieces_framework_1.Property.Number({
            displayName: 'Opening Balance',
            description: 'Initial deposit amount (for deposit accounts)',
            required: false,
        }),
        interestRate: pieces_framework_1.Property.Number({
            displayName: 'Interest Rate',
            description: 'Interest rate percentage (for deposit accounts)',
            required: false,
        }),
        // Loan account fields
        loanAmount: pieces_framework_1.Property.Number({
            displayName: 'Loan Amount',
            description: 'Principal loan amount (for loan accounts)',
            required: false,
        }),
        loanTerm: pieces_framework_1.Property.Number({
            displayName: 'Loan Term (months)',
            description: 'Loan term in months (for loan accounts)',
            required: false,
        }),
        loanRate: pieces_framework_1.Property.Number({
            displayName: 'Loan Interest Rate',
            description: 'Annual interest rate percentage (for loan accounts)',
            required: false,
        }),
        customFields: pieces_framework_1.Property.Json({
            displayName: 'Custom Fields (JSON)',
            description: 'Additional fields to include in the request body as JSON. These will be merged with the generated request.',
            required: false,
        }),
    },
    run: function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, accountType, partyId, branchId, productCode, openingBalance, interestRate, loanAmount, loanTerm, loanRate, customFields, auth, requestBody, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = context.propsValue, accountType = _a.accountType, partyId = _a.partyId, branchId = _a.branchId, productCode = _a.productCode, openingBalance = _a.openingBalance, interestRate = _a.interestRate, loanAmount = _a.loanAmount, loanTerm = _a.loanTerm, loanRate = _a.loanRate, customFields = _a.customFields;
                        auth = context.auth;
                        requestBody = {
                            AcctType: accountType,
                            PartyAcctRelInfo: {
                                PartyRef: {
                                    PartyKeys: {
                                        PartyId: partyId,
                                    },
                                },
                            },
                        };
                        // Add branch/product info
                        if (branchId || productCode) {
                            requestBody.AcctInfo = {};
                            if (branchId)
                                requestBody.AcctInfo.BranchId = branchId;
                            if (productCode)
                                requestBody.AcctInfo.ProductCode = productCode;
                        }
                        // Add deposit account info
                        if (accountType !== 'LOAN' && (openingBalance || interestRate)) {
                            if (!requestBody.AcctInfo)
                                requestBody.AcctInfo = {};
                            requestBody.AcctInfo.DepositAcctInfo = {};
                            if (openingBalance) {
                                requestBody.AcctInfo.DepositAcctInfo.OpeningBalance = openingBalance;
                            }
                            if (interestRate) {
                                requestBody.AcctInfo.DepositAcctInfo.Rate = interestRate;
                            }
                        }
                        // Add loan account info
                        if (accountType === 'LOAN' && (loanAmount || loanTerm || loanRate)) {
                            if (!requestBody.AcctInfo)
                                requestBody.AcctInfo = {};
                            requestBody.AcctInfo.LoanAcctInfo = {};
                            if (loanAmount) {
                                requestBody.AcctInfo.LoanAcctInfo.PrincipalAmt = loanAmount;
                            }
                            if (loanTerm) {
                                requestBody.AcctInfo.LoanAcctInfo.TermMonths = loanTerm;
                            }
                            if (loanRate) {
                                requestBody.AcctInfo.LoanAcctInfo.IntRate = loanRate;
                            }
                        }
                        // Merge custom fields if provided
                        if (customFields) {
                            Object.assign(requestBody, customFields);
                        }
                        return [4 /*yield*/, (0, client_1.callFiservApi)(pieces_common_1.HttpMethod.POST, auth, constants_1.ENDPOINTS.ACCOUNTS_ADD, requestBody)];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.body];
                }
            });
        });
    },
});
