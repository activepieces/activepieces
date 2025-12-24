"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignInRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const user_1 = require("../../user/user");
exports.SignInRequest = typebox_1.Type.Object({
    email: user_1.EmailType,
    password: user_1.PasswordType,
});
//# sourceMappingURL=sign-in-request.js.map