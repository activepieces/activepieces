"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationResponse = exports.UserWithoutPassword = void 0;
const typebox_1 = require("@sinclair/typebox");
const user_1 = require("../../user/user");
const user_identity_1 = require("../user-identity");
exports.UserWithoutPassword = typebox_1.Type.Pick(user_1.User, ['id', 'platformRole', 'status', 'externalId', 'platformId']);
exports.AuthenticationResponse = typebox_1.Type.Composite([
    exports.UserWithoutPassword,
    typebox_1.Type.Pick(user_identity_1.UserIdentity, ['verified', 'firstName', 'lastName', 'email', 'trackEvents', 'newsLetter']),
    typebox_1.Type.Object({
        token: typebox_1.Type.String(),
        projectId: typebox_1.Type.String(),
    }),
]);
//# sourceMappingURL=authentication-response.js.map