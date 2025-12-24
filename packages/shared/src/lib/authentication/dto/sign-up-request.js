"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchProjectRequest = exports.SwitchPlatformRequest = exports.SignUpRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../../common");
const id_generator_1 = require("../../common/id-generator");
const user_1 = require("../../user/user");
exports.SignUpRequest = typebox_1.Type.Object({
    email: user_1.EmailType,
    password: user_1.PasswordType,
    firstName: typebox_1.Type.String({
        pattern: common_1.SAFE_STRING_PATTERN,
    }),
    lastName: typebox_1.Type.String({
        pattern: common_1.SAFE_STRING_PATTERN,
    }),
    trackEvents: typebox_1.Type.Boolean(),
    newsLetter: typebox_1.Type.Boolean(),
});
exports.SwitchPlatformRequest = typebox_1.Type.Object({
    platformId: id_generator_1.ApId,
});
exports.SwitchProjectRequest = typebox_1.Type.Object({
    projectId: id_generator_1.ApId,
});
//# sourceMappingURL=sign-up-request.js.map