"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplyLicenseKeyByEmailRequestBody = exports.AdminRetryRunsRequestBody = exports.UpdatePlatformRequestBody = exports.Base64EncodedFile = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const id_generator_1 = require("../common/id-generator");
const multipart_file_1 = require("../common/multipart-file");
const federated_authn_1 = require("../federated-authn");
const platform_model_1 = require("./platform.model");
exports.Base64EncodedFile = typebox_1.Type.Object({
    base64: typebox_1.Type.String(),
    mimetype: typebox_1.Type.String(),
});
exports.UpdatePlatformRequestBody = typebox_1.Type.Object({
    name: typebox_1.Type.Optional(typebox_1.Type.String({
        pattern: common_1.SAFE_STRING_PATTERN,
    })),
    primaryColor: typebox_1.Type.Optional(typebox_1.Type.String()),
    logoIcon: typebox_1.Type.Optional(multipart_file_1.ApMultipartFile),
    fullLogo: typebox_1.Type.Optional(multipart_file_1.ApMultipartFile),
    favIcon: typebox_1.Type.Optional(multipart_file_1.ApMultipartFile),
    filteredPieceNames: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    filteredPieceBehavior: typebox_1.Type.Optional(typebox_1.Type.Enum(platform_model_1.FilteredPieceBehavior)),
    federatedAuthProviders: typebox_1.Type.Optional(federated_authn_1.FederatedAuthnProviderConfig),
    cloudAuthEnabled: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    emailAuthEnabled: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    allowedAuthDomains: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    enforceAllowedAuthDomains: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    pinnedPieces: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
});
exports.AdminRetryRunsRequestBody = typebox_1.Type.Object({
    runIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    createdAfter: typebox_1.Type.String(),
    createdBefore: typebox_1.Type.String(),
});
exports.ApplyLicenseKeyByEmailRequestBody = typebox_1.Type.Object({
    email: typebox_1.Type.String(),
    licenseKey: typebox_1.Type.String(),
});
//# sourceMappingURL=platform.request.js.map