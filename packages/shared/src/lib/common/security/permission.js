"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleType = exports.Permission = void 0;
// Check access-control-list.ts for the list of permissions, you can add new permissions there, restart the main server to apply the changes
var Permission;
(function (Permission) {
    Permission["READ_APP_CONNECTION"] = "READ_APP_CONNECTION";
    Permission["WRITE_APP_CONNECTION"] = "WRITE_APP_CONNECTION";
    Permission["READ_FLOW"] = "READ_FLOW";
    Permission["WRITE_FLOW"] = "WRITE_FLOW";
    Permission["UPDATE_FLOW_STATUS"] = "UPDATE_FLOW_STATUS";
    Permission["WRITE_INVITATION"] = "WRITE_INVITATION";
    Permission["READ_INVITATION"] = "READ_INVITATION";
    Permission["READ_PROJECT_MEMBER"] = "READ_PROJECT_MEMBER";
    Permission["WRITE_PROJECT_MEMBER"] = "WRITE_PROJECT_MEMBER";
    Permission["WRITE_PROJECT_RELEASE"] = "WRITE_PROJECT_RELEASE";
    Permission["READ_PROJECT_RELEASE"] = "READ_PROJECT_RELEASE";
    Permission["READ_RUN"] = "READ_RUN";
    Permission["WRITE_RUN"] = "WRITE_RUN";
    Permission["READ_FOLDER"] = "READ_FOLDER";
    Permission["WRITE_FOLDER"] = "WRITE_FOLDER";
    Permission["WRITE_ALERT"] = "WRITE_ALERT";
    Permission["READ_ALERT"] = "READ_ALERT";
    Permission["READ_MCP"] = "READ_MCP";
    Permission["WRITE_MCP"] = "WRITE_MCP";
    Permission["WRITE_PROJECT"] = "WRITE_PROJECT";
    Permission["READ_PROJECT"] = "READ_PROJECT";
    Permission["READ_TODOS"] = "READ_TODOS";
    Permission["WRITE_TODOS"] = "WRITE_TODOS";
    Permission["READ_TABLE"] = "READ_TABLE";
    Permission["WRITE_TABLE"] = "WRITE_TABLE";
})(Permission || (exports.Permission = Permission = {}));
var RoleType;
(function (RoleType) {
    RoleType["DEFAULT"] = "DEFAULT";
    RoleType["CUSTOM"] = "CUSTOM";
})(RoleType || (exports.RoleType = RoleType = {}));
//# sourceMappingURL=permission.js.map