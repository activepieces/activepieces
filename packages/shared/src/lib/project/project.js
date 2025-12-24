"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_COLOR_PALETTE = exports.ProjectWithLimitsWithPlatform = exports.ProjectMetaData = exports.UpdateProjectRequestInCommunity = exports.ProjectWithLimits = exports.Project = exports.ProjectIcon = exports.ProjectPlan = exports.SwitchProjectResponse = exports.ProjectType = exports.PiecesFilterType = exports.ColorName = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const base_model_1 = require("../common/base-model");
const id_generator_1 = require("../common/id-generator");
const metadata_1 = require("../common/metadata");
var ColorName;
(function (ColorName) {
    ColorName["RED"] = "RED";
    ColorName["BLUE"] = "BLUE";
    ColorName["YELLOW"] = "YELLOW";
    ColorName["PURPLE"] = "PURPLE";
    ColorName["GREEN"] = "GREEN";
    ColorName["PINK"] = "PINK";
    ColorName["VIOLET"] = "VIOLET";
    ColorName["ORANGE"] = "ORANGE";
    ColorName["DARK_GREEN"] = "DARK_GREEN";
    ColorName["CYAN"] = "CYAN";
    ColorName["LAVENDER"] = "LAVENDER";
    ColorName["DEEP_ORANGE"] = "DEEP_ORANGE";
})(ColorName || (exports.ColorName = ColorName = {}));
var PiecesFilterType;
(function (PiecesFilterType) {
    PiecesFilterType["NONE"] = "NONE";
    PiecesFilterType["ALLOWED"] = "ALLOWED";
})(PiecesFilterType || (exports.PiecesFilterType = PiecesFilterType = {}));
var ProjectType;
(function (ProjectType) {
    ProjectType["TEAM"] = "TEAM";
    ProjectType["PERSONAL"] = "PERSONAL";
})(ProjectType || (exports.ProjectType = ProjectType = {}));
exports.SwitchProjectResponse = typebox_1.Type.Object({
    token: typebox_1.Type.String(),
});
exports.ProjectPlan = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { projectId: typebox_1.Type.String(), locked: typebox_1.Type.Boolean({ default: false }), name: typebox_1.Type.String(), piecesFilterType: typebox_1.Type.Enum(PiecesFilterType), pieces: typebox_1.Type.Array(typebox_1.Type.String()) }));
exports.ProjectIcon = typebox_1.Type.Object({
    color: typebox_1.Type.Enum(ColorName),
});
exports.Project = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { deleted: (0, base_model_1.Nullable)(typebox_1.Type.String()), ownerId: typebox_1.Type.String(), displayName: typebox_1.Type.String(), platformId: id_generator_1.ApId, maxConcurrentJobs: (0, base_model_1.Nullable)(typebox_1.Type.Number()), type: typebox_1.Type.Enum(ProjectType), icon: exports.ProjectIcon, externalId: typebox_1.Type.Optional(typebox_1.Type.String()), releasesEnabled: typebox_1.Type.Boolean(), metadata: (0, base_model_1.Nullable)(metadata_1.Metadata) }));
const projectAnalytics = typebox_1.Type.Object({
    totalUsers: typebox_1.Type.Number(),
    activeUsers: typebox_1.Type.Number(),
    totalFlows: typebox_1.Type.Number(),
    activeFlows: typebox_1.Type.Number(),
});
exports.ProjectWithLimits = typebox_1.Type.Composite([
    typebox_1.Type.Omit(exports.Project, ['deleted']),
    typebox_1.Type.Object({
        plan: exports.ProjectPlan,
        analytics: projectAnalytics,
    }),
]);
exports.UpdateProjectRequestInCommunity = typebox_1.Type.Object({
    displayName: typebox_1.Type.Optional(typebox_1.Type.String({
        pattern: common_1.SAFE_STRING_PATTERN,
    })),
    metadata: typebox_1.Type.Optional(metadata_1.Metadata),
});
exports.ProjectMetaData = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
});
exports.ProjectWithLimitsWithPlatform = typebox_1.Type.Object({
    platformName: typebox_1.Type.String(),
    projects: typebox_1.Type.Array(exports.ProjectWithLimits),
});
const ProjectColor = typebox_1.Type.Object({
    textColor: typebox_1.Type.String(),
    color: typebox_1.Type.String(),
});
exports.PROJECT_COLOR_PALETTE = {
    [ColorName.RED]: {
        textColor: '#ffffff',
        color: '#ef4444',
    },
    [ColorName.BLUE]: {
        textColor: '#ffffff',
        color: '#3b82f6',
    },
    [ColorName.YELLOW]: {
        textColor: '#ffffff',
        color: '#eab308',
    },
    [ColorName.PURPLE]: {
        textColor: '#ffffff',
        color: '#a855f7',
    },
    [ColorName.GREEN]: {
        textColor: '#ffffff',
        color: '#22c55e',
    },
    [ColorName.PINK]: {
        textColor: '#ffffff',
        color: '#f472b6',
    },
    [ColorName.VIOLET]: {
        textColor: '#ffffff',
        color: '#9333ea',
    },
    [ColorName.ORANGE]: {
        textColor: '#ffffff',
        color: '#f97316',
    },
    [ColorName.DARK_GREEN]: {
        textColor: '#ffffff',
        color: '#15803d',
    },
    [ColorName.CYAN]: {
        textColor: '#ffffff',
        color: '#06b6d4',
    },
    [ColorName.LAVENDER]: {
        textColor: '#ffffff',
        color: '#8b5cf6',
    },
    [ColorName.DEEP_ORANGE]: {
        textColor: '#ffffff',
        color: '#ea580c',
    },
};
//# sourceMappingURL=project.js.map