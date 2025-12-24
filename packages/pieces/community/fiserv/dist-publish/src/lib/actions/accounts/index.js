"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccount = exports.getAccount = exports.createAccount = void 0;
// Account actions
var create_account_1 = require("./create-account");
Object.defineProperty(exports, "createAccount", { enumerable: true, get: function () { return create_account_1.createAccount; } });
var get_account_1 = require("./get-account");
Object.defineProperty(exports, "getAccount", { enumerable: true, get: function () { return get_account_1.getAccount; } });
var update_account_1 = require("./update-account");
Object.defineProperty(exports, "updateAccount", { enumerable: true, get: function () { return update_account_1.updateAccount; } });
// Deferred to future phase (specialized updates):
// - Update Overdraft (/accounts/overdraft)
// - Update Term Deposit (/accounts/termDeposit)
// - Update Interest Deposit (/accounts/interestDeposit)
