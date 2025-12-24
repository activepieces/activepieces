"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollateral = exports.updateCollateral = exports.getCollateral = exports.addCollateral = void 0;
// Collateral actions
var add_collateral_1 = require("./add-collateral");
Object.defineProperty(exports, "addCollateral", { enumerable: true, get: function () { return add_collateral_1.addCollateral; } });
var get_collateral_1 = require("./get-collateral");
Object.defineProperty(exports, "getCollateral", { enumerable: true, get: function () { return get_collateral_1.getCollateral; } });
var update_collateral_1 = require("./update-collateral");
Object.defineProperty(exports, "updateCollateral", { enumerable: true, get: function () { return update_collateral_1.updateCollateral; } });
var delete_collateral_1 = require("./delete-collateral");
Object.defineProperty(exports, "deleteCollateral", { enumerable: true, get: function () { return delete_collateral_1.deleteCollateral; } });
