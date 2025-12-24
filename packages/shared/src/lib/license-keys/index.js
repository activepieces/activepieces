"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTrialLicenseKeyRequestBody = exports.LicenseKeyEntity = exports.VerifyLicenseKeyRequestBody = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.VerifyLicenseKeyRequestBody = typebox_1.Type.Object({
    licenseKey: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
});
exports.LicenseKeyEntity = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    email: typebox_1.Type.String(),
    expiresAt: typebox_1.Type.String(),
    activatedAt: typebox_1.Type.String(),
    createdAt: typebox_1.Type.String(),
    key: typebox_1.Type.String(),
    ssoEnabled: typebox_1.Type.Boolean(),
    environmentsEnabled: typebox_1.Type.Boolean(),
    showPoweredBy: typebox_1.Type.Boolean(),
    embeddingEnabled: typebox_1.Type.Boolean(),
    auditLogEnabled: typebox_1.Type.Boolean(),
    customAppearanceEnabled: typebox_1.Type.Boolean(),
    manageProjectsEnabled: typebox_1.Type.Boolean(),
    managePiecesEnabled: typebox_1.Type.Boolean(),
    manageTemplatesEnabled: typebox_1.Type.Boolean(),
    apiKeysEnabled: typebox_1.Type.Boolean(),
    customDomainsEnabled: typebox_1.Type.Boolean(),
    projectRolesEnabled: typebox_1.Type.Boolean(),
    analyticsEnabled: typebox_1.Type.Boolean(),
    globalConnectionsEnabled: typebox_1.Type.Boolean(),
    customRolesEnabled: typebox_1.Type.Boolean(),
    agentsEnabled: typebox_1.Type.Boolean(),
    tablesEnabled: typebox_1.Type.Boolean(),
    todosEnabled: typebox_1.Type.Boolean(),
    mcpsEnabled: typebox_1.Type.Boolean(),
});
exports.CreateTrialLicenseKeyRequestBody = typebox_1.Type.Composite([typebox_1.Type.Object({
        email: typebox_1.Type.String(),
        companyName: typebox_1.Type.String(),
        goal: typebox_1.Type.String(),
        keyType: typebox_1.Type.Optional(typebox_1.Type.String()),
    }), typebox_1.Type.Omit(exports.LicenseKeyEntity, ['id', 'email', 'expiresAt', 'activatedAt', 'key', 'createdAt'])]);
//# sourceMappingURL=index.js.map