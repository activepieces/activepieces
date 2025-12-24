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
exports.addEscrow = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
var client_1 = require("../../../common/client");
var pieces_common_1 = require("@activepieces/pieces-common");
var auth_1 = require("../../../common/auth");
var constants_1 = require("../../../common/constants");
exports.addEscrow = (0, pieces_framework_1.createAction)({
    name: 'escrow_add',
    displayName: 'Escrow - Add',
    description: 'Add escrow account to a loan in Fiserv',
    auth: auth_1.fiservAuth,
    props: {
        loanId: pieces_framework_1.Property.ShortText({
            displayName: 'Loan ID',
            description: 'The ID of the loan to add escrow to',
            required: true,
        }),
        escrowType: pieces_framework_1.Property.StaticDropdown({
            displayName: 'Escrow Type',
            description: 'Type of escrow account',
            required: true,
            options: {
                options: [
                    { label: 'Property Tax', value: 'PropertyTax' },
                    { label: 'Insurance', value: 'Insurance' },
                    { label: 'HOA Fees', value: 'HOAFees' },
                    { label: 'Flood Insurance', value: 'FloodInsurance' },
                    { label: 'PMI', value: 'PMI' },
                    { label: 'Other', value: 'Other' },
                ],
            },
        }),
        monthlyPayment: pieces_framework_1.Property.Number({
            displayName: 'Monthly Payment',
            description: 'Monthly escrow payment amount',
            required: true,
        }),
        currentBalance: pieces_framework_1.Property.Number({
            displayName: 'Current Balance',
            description: 'Current escrow account balance',
            required: false,
            defaultValue: 0,
        }),
        targetBalance: pieces_framework_1.Property.Number({
            displayName: 'Target Balance',
            description: 'Target escrow balance to maintain',
            required: false,
        }),
        payee: pieces_framework_1.Property.ShortText({
            displayName: 'Payee',
            description: 'Name of the entity receiving escrow payments',
            required: false,
        }),
        accountNumber: pieces_framework_1.Property.ShortText({
            displayName: 'Account Number',
            description: 'Escrow account number or reference',
            required: false,
        }),
    },
    run: function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, loanId, escrowType, monthlyPayment, currentBalance, targetBalance, payee, accountNumber, auth, requestBody, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = context.propsValue, loanId = _a.loanId, escrowType = _a.escrowType, monthlyPayment = _a.monthlyPayment, currentBalance = _a.currentBalance, targetBalance = _a.targetBalance, payee = _a.payee, accountNumber = _a.accountNumber;
                        auth = context.auth;
                        requestBody = {
                            LoanKeys: {
                                LoanId: loanId,
                            },
                            EscrowInfo: {
                                EscrowType: escrowType,
                                MonthlyPayment: monthlyPayment,
                                CurrentBalance: currentBalance || 0,
                            },
                        };
                        // Add optional fields
                        if (targetBalance !== undefined && targetBalance !== null) {
                            requestBody.EscrowInfo.TargetBalance = targetBalance;
                        }
                        if (payee) {
                            requestBody.EscrowInfo.Payee = payee;
                        }
                        if (accountNumber) {
                            requestBody.EscrowInfo.AccountNumber = accountNumber;
                        }
                        return [4 /*yield*/, (0, client_1.callFiservApi)(pieces_common_1.HttpMethod.POST, auth, constants_1.ENDPOINTS.ESCROW_ADD, requestBody)];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.body];
                }
            });
        });
    },
});
