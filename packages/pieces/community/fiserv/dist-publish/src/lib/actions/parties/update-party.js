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
exports.updateParty = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
var client_1 = require("../../common/client");
var pieces_common_1 = require("@activepieces/pieces-common");
var auth_1 = require("../../common/auth");
var props_1 = require("../../common/props");
var constants_1 = require("../../common/constants");
exports.updateParty = (0, pieces_framework_1.createAction)({
    name: 'party_update',
    displayName: 'Party - Update',
    description: 'Update party (customer) information in Fiserv',
    auth: auth_1.fiservAuth,
    props: {
        partyId: props_1.partyIdProp,
        // Person fields
        firstName: pieces_framework_1.Property.ShortText({
            displayName: 'First Name',
            description: 'Updated first name',
            required: false,
        }),
        middleName: pieces_framework_1.Property.ShortText({
            displayName: 'Middle Name',
            description: 'Updated middle name',
            required: false,
        }),
        lastName: pieces_framework_1.Property.ShortText({
            displayName: 'Last Name',
            description: 'Updated last name',
            required: false,
        }),
        // Organization fields
        organizationName: pieces_framework_1.Property.ShortText({
            displayName: 'Organization Name',
            description: 'Updated organization name',
            required: false,
        }),
        // Common fields
        email: pieces_framework_1.Property.ShortText({
            displayName: 'Email',
            description: 'Updated email address',
            required: false,
        }),
        phoneNumber: pieces_framework_1.Property.ShortText({
            displayName: 'Phone Number',
            description: 'Updated phone number',
            required: false,
        }),
    },
    run: function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, partyId, firstName, middleName, lastName, organizationName, email, phoneNumber, auth, requestBody, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = context.propsValue, partyId = _a.partyId, firstName = _a.firstName, middleName = _a.middleName, lastName = _a.lastName, organizationName = _a.organizationName, email = _a.email, phoneNumber = _a.phoneNumber;
                        auth = context.auth;
                        requestBody = {
                            PartyKeys: {
                                PartyId: partyId,
                            },
                        };
                        // Add person info if any person fields are provided
                        if (firstName || middleName || lastName) {
                            requestBody.PersonPartyInfo = {
                                PersonName: {},
                            };
                            if (firstName)
                                requestBody.PersonPartyInfo.PersonName.FirstName = firstName;
                            if (middleName)
                                requestBody.PersonPartyInfo.PersonName.MiddleName = middleName;
                            if (lastName)
                                requestBody.PersonPartyInfo.PersonName.LastName = lastName;
                        }
                        // Add org info if provided
                        if (organizationName) {
                            requestBody.OrgPartyInfo = {
                                OrgName: organizationName,
                            };
                        }
                        // Add contact info if provided
                        if (email || phoneNumber) {
                            requestBody.ContactInfo = {};
                            if (email)
                                requestBody.ContactInfo.EmailAddr = email;
                            if (phoneNumber)
                                requestBody.ContactInfo.PhoneNum = phoneNumber;
                        }
                        return [4 /*yield*/, (0, client_1.callFiservApi)(pieces_common_1.HttpMethod.PUT, auth, constants_1.ENDPOINTS.PARTIES_UPDATE, requestBody)];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.body];
                }
            });
        });
    },
});
