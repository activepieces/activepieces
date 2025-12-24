"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiecePackageInformation = exports.PieceMetadataModelSummary = exports.PieceMetadataModel = exports.PieceMetadataSummary = exports.PieceMetadata = exports.TriggerBase = exports.ActionBase = exports.PieceBase = void 0;
const property_1 = require("./property");
const trigger_1 = require("./trigger/trigger");
const action_1 = require("./action/action");
const authentication_1 = require("./property/authentication");
const typebox_1 = require("@sinclair/typebox");
const shared_1 = require("@activepieces/shared");
const I18nForPiece = typebox_1.Type.Optional(typebox_1.Type.Partial(typebox_1.Type.Record(typebox_1.Type.Enum(shared_1.LocalesEnum), typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String()))));
exports.PieceBase = typebox_1.Type.Object({
    id: typebox_1.Type.Optional(typebox_1.Type.String()),
    name: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
    logoUrl: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    projectId: typebox_1.Type.Optional(typebox_1.Type.String()),
    authors: typebox_1.Type.Array(typebox_1.Type.String()),
    platformId: typebox_1.Type.Optional(typebox_1.Type.String()),
    directoryPath: typebox_1.Type.Optional(typebox_1.Type.String()),
    auth: typebox_1.Type.Optional(typebox_1.Type.Union([authentication_1.PieceAuthProperty, typebox_1.Type.Array(authentication_1.PieceAuthProperty)])),
    version: typebox_1.Type.String(),
    categories: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(shared_1.PieceCategory))),
    minimumSupportedRelease: typebox_1.Type.Optional(typebox_1.Type.String()),
    maximumSupportedRelease: typebox_1.Type.Optional(typebox_1.Type.String()),
    i18n: I18nForPiece,
});
exports.ActionBase = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    props: property_1.PiecePropertyMap,
    requireAuth: typebox_1.Type.Boolean(),
    errorHandlingOptions: typebox_1.Type.Optional(action_1.ErrorHandlingOptionsParam),
});
exports.TriggerBase = typebox_1.Type.Composite([
    typebox_1.Type.Omit(exports.ActionBase, ["requireAuth"]),
    typebox_1.Type.Object({
        type: typebox_1.Type.Enum(shared_1.TriggerStrategy),
        sampleData: typebox_1.Type.Unknown(),
        handshakeConfiguration: typebox_1.Type.Optional(shared_1.WebhookHandshakeConfiguration),
        renewConfiguration: typebox_1.Type.Optional(trigger_1.WebhookRenewConfiguration),
        testStrategy: typebox_1.Type.Enum(shared_1.TriggerTestStrategy),
    })
]);
exports.PieceMetadata = typebox_1.Type.Composite([
    exports.PieceBase,
    typebox_1.Type.Object({
        actions: typebox_1.Type.Record(typebox_1.Type.String(), exports.ActionBase),
        triggers: typebox_1.Type.Record(typebox_1.Type.String(), exports.TriggerBase),
    })
]);
exports.PieceMetadataSummary = typebox_1.Type.Composite([
    typebox_1.Type.Omit(exports.PieceMetadata, ["actions", "triggers"]),
    typebox_1.Type.Object({
        actions: typebox_1.Type.Number(),
        triggers: typebox_1.Type.Number(),
        suggestedActions: typebox_1.Type.Optional(typebox_1.Type.Array(exports.TriggerBase)),
        suggestedTriggers: typebox_1.Type.Optional(typebox_1.Type.Array(exports.ActionBase)),
    })
]);
const PiecePackageMetadata = typebox_1.Type.Object({
    projectUsage: typebox_1.Type.Number(),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    pieceType: typebox_1.Type.Enum(shared_1.PieceType),
    packageType: typebox_1.Type.Enum(shared_1.PackageType),
    platformId: typebox_1.Type.Optional(typebox_1.Type.String()),
    archiveId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.PieceMetadataModel = typebox_1.Type.Composite([
    exports.PieceMetadata,
    PiecePackageMetadata
]);
exports.PieceMetadataModelSummary = typebox_1.Type.Composite([
    exports.PieceMetadataSummary,
    PiecePackageMetadata
]);
exports.PiecePackageInformation = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    version: typebox_1.Type.String(),
});
//# sourceMappingURL=piece-metadata.js.map