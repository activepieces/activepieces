"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUserInvitationsRequest = exports.AcceptUserInvitationRequest = exports.SendUserInvitationRequest = exports.UserInvitationWithLink = exports.UserInvitation = exports.InvitationStatus = exports.InvitationType = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const project_role_1 = require("../project-role/project-role");
const index_1 = require("../user/index");
var InvitationType;
(function (InvitationType) {
    InvitationType["PLATFORM"] = "PLATFORM";
    InvitationType["PROJECT"] = "PROJECT";
})(InvitationType || (exports.InvitationType = InvitationType = {}));
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
exports.UserInvitation = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { email: typebox_1.Type.String(), status: typebox_1.Type.Enum(InvitationStatus), type: typebox_1.Type.Enum(InvitationType), platformId: typebox_1.Type.String(), platformRole: (0, common_1.NullableEnum)(typebox_1.Type.Enum(index_1.PlatformRole)), projectId: (0, common_1.Nullable)(typebox_1.Type.String()), projectRoleId: (0, common_1.Nullable)(typebox_1.Type.String()), projectRole: (0, common_1.Nullable)(project_role_1.ProjectRole) }));
exports.UserInvitationWithLink = typebox_1.Type.Composite([exports.UserInvitation, typebox_1.Type.Object({
        link: typebox_1.Type.Optional(typebox_1.Type.String()),
    })]);
exports.SendUserInvitationRequest = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(InvitationType.PROJECT),
        email: typebox_1.Type.String(),
        projectId: typebox_1.Type.String(),
        projectRole: typebox_1.Type.String(),
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(InvitationType.PLATFORM),
        email: typebox_1.Type.String(),
        platformRole: typebox_1.Type.Enum(index_1.PlatformRole),
    }),
]);
exports.AcceptUserInvitationRequest = typebox_1.Type.Object({
    invitationToken: typebox_1.Type.String(),
});
exports.ListUserInvitationsRequest = typebox_1.Type.Object({
    limit: typebox_1.Type.Optional(typebox_1.Type.Number()),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
    type: typebox_1.Type.Enum(InvitationType),
    projectId: (0, common_1.Nullable)(typebox_1.Type.String()),
    status: typebox_1.Type.Optional(typebox_1.Type.Enum(InvitationStatus)),
});
//# sourceMappingURL=index.js.map