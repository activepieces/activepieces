"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformBillingInformation = exports.PlatformWithoutSensitiveData = exports.Platform = exports.PlatformPlanLimits = exports.PlatformPlan = exports.TeamProjectsLimit = exports.PlanName = exports.AiOverageState = exports.PlatformUsage = exports.PlatformUsageMetric = exports.FilteredPieceBehavior = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
const id_generator_1 = require("../common/id-generator");
const federated_authn_1 = require("../federated-authn");
var FilteredPieceBehavior;
(function (FilteredPieceBehavior) {
    FilteredPieceBehavior["ALLOWED"] = "ALLOWED";
    FilteredPieceBehavior["BLOCKED"] = "BLOCKED";
})(FilteredPieceBehavior || (exports.FilteredPieceBehavior = FilteredPieceBehavior = {}));
var PlatformUsageMetric;
(function (PlatformUsageMetric) {
    PlatformUsageMetric["AI_CREDITS"] = "ai-credits";
    PlatformUsageMetric["ACTIVE_FLOWS"] = "active-flows";
})(PlatformUsageMetric || (exports.PlatformUsageMetric = PlatformUsageMetric = {}));
exports.PlatformUsage = typebox_1.Type.Object({
    aiCredits: typebox_1.Type.Number(),
    activeFlows: typebox_1.Type.Number(),
});
var AiOverageState;
(function (AiOverageState) {
    AiOverageState["NOT_ALLOWED"] = "not_allowed";
    AiOverageState["ALLOWED_BUT_OFF"] = "allowed_but_off";
    AiOverageState["ALLOWED_AND_ON"] = "allowed_and_on";
})(AiOverageState || (exports.AiOverageState = AiOverageState = {}));
var PlanName;
(function (PlanName) {
    PlanName["STANDARD"] = "standard";
    PlanName["ENTERPRISE"] = "enterprise";
    PlanName["APPSUMO_ACTIVEPIECES_TIER1"] = "appsumo_activepieces_tier1";
    PlanName["APPSUMO_ACTIVEPIECES_TIER2"] = "appsumo_activepieces_tier2";
    PlanName["APPSUMO_ACTIVEPIECES_TIER3"] = "appsumo_activepieces_tier3";
    PlanName["APPSUMO_ACTIVEPIECES_TIER4"] = "appsumo_activepieces_tier4";
    PlanName["APPSUMO_ACTIVEPIECES_TIER5"] = "appsumo_activepieces_tier5";
    PlanName["APPSUMO_ACTIVEPIECES_TIER6"] = "appsumo_activepieces_tier6";
})(PlanName || (exports.PlanName = PlanName = {}));
var TeamProjectsLimit;
(function (TeamProjectsLimit) {
    TeamProjectsLimit["NONE"] = "NONE";
    TeamProjectsLimit["ONE"] = "ONE";
    TeamProjectsLimit["UNLIMITED"] = "UNLIMITED";
})(TeamProjectsLimit || (exports.TeamProjectsLimit = TeamProjectsLimit = {}));
exports.PlatformPlan = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { 
    // TODO: We have to use the enum when we finalize the plan names
    plan: typebox_1.Type.Optional(typebox_1.Type.String()), openRouterApiKeyHash: typebox_1.Type.Optional(typebox_1.Type.String()), openRouterApiKey: typebox_1.Type.Optional(typebox_1.Type.String()), platformId: typebox_1.Type.String(), includedAiCredits: typebox_1.Type.Number(), aiCreditsOverageLimit: typebox_1.Type.Optional(typebox_1.Type.Number()), aiCreditsOverageState: typebox_1.Type.Optional(typebox_1.Type.String()), environmentsEnabled: typebox_1.Type.Boolean(), analyticsEnabled: typebox_1.Type.Boolean(), showPoweredBy: typebox_1.Type.Boolean(), agentsEnabled: typebox_1.Type.Boolean(), mcpsEnabled: typebox_1.Type.Boolean(), tablesEnabled: typebox_1.Type.Boolean(), todosEnabled: typebox_1.Type.Boolean(), auditLogEnabled: typebox_1.Type.Boolean(), embeddingEnabled: typebox_1.Type.Boolean(), managePiecesEnabled: typebox_1.Type.Boolean(), manageTemplatesEnabled: typebox_1.Type.Boolean(), customAppearanceEnabled: typebox_1.Type.Boolean(), teamProjectsLimit: typebox_1.Type.Enum(TeamProjectsLimit), projectRolesEnabled: typebox_1.Type.Boolean(), customDomainsEnabled: typebox_1.Type.Boolean(), globalConnectionsEnabled: typebox_1.Type.Boolean(), customRolesEnabled: typebox_1.Type.Boolean(), apiKeysEnabled: typebox_1.Type.Boolean(), ssoEnabled: typebox_1.Type.Boolean(), licenseKey: typebox_1.Type.Optional(typebox_1.Type.String()), licenseExpiresAt: typebox_1.Type.Optional(typebox_1.Type.String()), stripeCustomerId: typebox_1.Type.Optional(typebox_1.Type.String()), stripeSubscriptionId: typebox_1.Type.Optional(typebox_1.Type.String()), stripeSubscriptionStatus: typebox_1.Type.Optional(typebox_1.Type.String()), stripeSubscriptionStartDate: typebox_1.Type.Optional(typebox_1.Type.Number()), stripeSubscriptionEndDate: typebox_1.Type.Optional(typebox_1.Type.Number()), stripeSubscriptionCancelDate: typebox_1.Type.Optional(typebox_1.Type.Number()), projectsLimit: (0, base_model_1.Nullable)(typebox_1.Type.Number()), activeFlowsLimit: (0, base_model_1.Nullable)(typebox_1.Type.Number()), dedicatedWorkers: (0, base_model_1.Nullable)(typebox_1.Type.Object({
        trustedEnvironment: typebox_1.Type.Boolean(),
    })) }));
exports.PlatformPlanLimits = typebox_1.Type.Omit(exports.PlatformPlan, ['id', 'platformId', 'created', 'updated']);
exports.Platform = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { ownerId: id_generator_1.ApId, name: typebox_1.Type.String(), primaryColor: typebox_1.Type.String(), logoIconUrl: typebox_1.Type.String(), fullLogoUrl: typebox_1.Type.String(), favIconUrl: typebox_1.Type.String(), 
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceNames: typebox_1.Type.Array(typebox_1.Type.String()), 
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceBehavior: typebox_1.Type.Enum(FilteredPieceBehavior), cloudAuthEnabled: typebox_1.Type.Boolean(), enforceAllowedAuthDomains: typebox_1.Type.Boolean(), allowedAuthDomains: typebox_1.Type.Array(typebox_1.Type.String()), federatedAuthProviders: federated_authn_1.FederatedAuthnProviderConfig, emailAuthEnabled: typebox_1.Type.Boolean(), pinnedPieces: typebox_1.Type.Array(typebox_1.Type.String()) }));
exports.PlatformWithoutSensitiveData = typebox_1.Type.Composite([typebox_1.Type.Object({
        federatedAuthProviders: (0, base_model_1.Nullable)(federated_authn_1.FederatedAuthnProviderConfigWithoutSensitiveData),
        plan: exports.PlatformPlanLimits,
        usage: typebox_1.Type.Optional(exports.PlatformUsage),
    }), typebox_1.Type.Pick(exports.Platform, [
        'id',
        'created',
        'updated',
        'ownerId',
        'name',
        'plan',
        'primaryColor',
        'logoIconUrl',
        'fullLogoUrl',
        'favIconUrl',
        'filteredPieceNames',
        'filteredPieceBehavior',
        'cloudAuthEnabled',
        'enforceAllowedAuthDomains',
        'allowedAuthDomains',
        'emailAuthEnabled',
        'pinnedPieces',
    ])]);
exports.PlatformBillingInformation = typebox_1.Type.Object({
    plan: exports.PlatformPlan,
    usage: exports.PlatformUsage,
    nextBillingDate: typebox_1.Type.Number(),
    nextBillingAmount: typebox_1.Type.Number(),
    cancelAt: typebox_1.Type.Optional(typebox_1.Type.Number()),
});
//# sourceMappingURL=platform.model.js.map