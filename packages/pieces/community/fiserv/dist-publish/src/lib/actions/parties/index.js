"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParty = exports.getParty = exports.createParty = void 0;
// Party actions
var create_party_1 = require("./create-party");
Object.defineProperty(exports, "createParty", { enumerable: true, get: function () { return create_party_1.createParty; } });
var get_party_1 = require("./get-party");
Object.defineProperty(exports, "getParty", { enumerable: true, get: function () { return get_party_1.getParty; } });
var update_party_1 = require("./update-party");
Object.defineProperty(exports, "updateParty", { enumerable: true, get: function () { return update_party_1.updateParty; } });
// Deferred to future phase (separate endpoints):
// - Add/Update/Delete Address (/parties/address)
// - Add/Delete Phone (/parties/phoneNum)
// - Add/Delete Email (/parties/email)
