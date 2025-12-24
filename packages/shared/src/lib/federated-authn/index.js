"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederatedAuthnProviderConfigWithoutSensitiveData = exports.FederatedAuthnProviderConfig = exports.SAMLAuthnProviderConfig = exports.GithubAuthnProviderConfig = exports.GoogleAuthnProviderConfig = exports.ClaimTokenRequest = exports.federatedAuthnLoginResponse = void 0;
const tslib_1 = require("tslib");
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const authn_provider_name_1 = require("./authn-provider-name");
tslib_1.__exportStar(require("./authn-provider-name"), exports);
exports.federatedAuthnLoginResponse = typebox_1.Type.Object({
    loginUrl: typebox_1.Type.String(),
});
exports.ClaimTokenRequest = typebox_1.Type.Object({
    providerName: typebox_1.Type.Enum(authn_provider_name_1.ThirdPartyAuthnProviderEnum),
    code: typebox_1.Type.String(),
});
exports.GoogleAuthnProviderConfig = typebox_1.Type.Object({
    clientId: typebox_1.Type.String(),
    clientSecret: typebox_1.Type.String(),
});
exports.GithubAuthnProviderConfig = typebox_1.Type.Object({
    clientId: typebox_1.Type.String(),
    clientSecret: typebox_1.Type.String(),
});
exports.SAMLAuthnProviderConfig = typebox_1.Type.Object({
    idpMetadata: typebox_1.Type.String(),
    idpCertificate: typebox_1.Type.String(),
});
exports.FederatedAuthnProviderConfig = typebox_1.Type.Object({
    google: (0, common_1.Nullable)(exports.GoogleAuthnProviderConfig),
    github: (0, common_1.Nullable)(exports.GithubAuthnProviderConfig),
    saml: (0, common_1.Nullable)(exports.SAMLAuthnProviderConfig),
});
exports.FederatedAuthnProviderConfigWithoutSensitiveData = typebox_1.Type.Object({
    google: (0, common_1.Nullable)(typebox_1.Type.Pick(exports.GoogleAuthnProviderConfig, ['clientId'])),
    github: (0, common_1.Nullable)(typebox_1.Type.Pick(exports.GithubAuthnProviderConfig, ['clientId'])),
    saml: (0, common_1.Nullable)(typebox_1.Type.Object({})),
});
//# sourceMappingURL=index.js.map