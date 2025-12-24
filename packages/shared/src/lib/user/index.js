"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUsersRequestBody = exports.UpdateUserRequestBody = void 0;
const tslib_1 = require("tslib");
const typebox_1 = require("@sinclair/typebox");
const user_1 = require("./user");
tslib_1.__exportStar(require("./user"), exports);
exports.UpdateUserRequestBody = typebox_1.Type.Object({
    status: typebox_1.Type.Optional(typebox_1.Type.Enum(user_1.UserStatus)),
    platformRole: typebox_1.Type.Optional(typebox_1.Type.Enum(user_1.PlatformRole)),
    externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ListUsersRequestBody = typebox_1.Type.Object({
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number()),
    externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
//# sourceMappingURL=index.js.map