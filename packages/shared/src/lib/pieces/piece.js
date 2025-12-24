"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieceCategory = exports.PiecePackage = exports.PublicPiecePackage = exports.CustomNpmPiecePackage = exports.OfficialPiecePackage = exports.PrivatePiecePackage = exports.PieceType = exports.PackageType = void 0;
const typebox_1 = require("@sinclair/typebox");
var PackageType;
(function (PackageType) {
    PackageType["ARCHIVE"] = "ARCHIVE";
    PackageType["REGISTRY"] = "REGISTRY";
})(PackageType || (exports.PackageType = PackageType = {}));
var PieceType;
(function (PieceType) {
    PieceType["CUSTOM"] = "CUSTOM";
    PieceType["OFFICIAL"] = "OFFICIAL";
})(PieceType || (exports.PieceType = PieceType = {}));
exports.PrivatePiecePackage = typebox_1.Type.Object({
    packageType: typebox_1.Type.Literal(PackageType.ARCHIVE),
    pieceType: typebox_1.Type.Enum(PieceType),
    pieceName: typebox_1.Type.String(),
    pieceVersion: typebox_1.Type.String(),
    archiveId: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
});
exports.OfficialPiecePackage = typebox_1.Type.Object({
    packageType: typebox_1.Type.Literal(PackageType.REGISTRY),
    pieceType: typebox_1.Type.Literal(PieceType.OFFICIAL),
    pieceName: typebox_1.Type.String(),
    pieceVersion: typebox_1.Type.String(),
});
exports.CustomNpmPiecePackage = typebox_1.Type.Object({
    packageType: typebox_1.Type.Literal(PackageType.REGISTRY),
    pieceType: typebox_1.Type.Literal(PieceType.CUSTOM),
    pieceName: typebox_1.Type.String(),
    pieceVersion: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
});
exports.PublicPiecePackage = typebox_1.Type.Union([exports.OfficialPiecePackage, exports.CustomNpmPiecePackage]);
exports.PiecePackage = typebox_1.Type.Union([exports.PrivatePiecePackage, exports.OfficialPiecePackage, exports.CustomNpmPiecePackage]);
var PieceCategory;
(function (PieceCategory) {
    PieceCategory["ARTIFICIAL_INTELLIGENCE"] = "ARTIFICIAL_INTELLIGENCE";
    PieceCategory["COMMUNICATION"] = "COMMUNICATION";
    PieceCategory["COMMERCE"] = "COMMERCE";
    PieceCategory["CORE"] = "CORE";
    PieceCategory["UNIVERSAL_AI"] = "UNIVERSAL_AI";
    PieceCategory["FLOW_CONTROL"] = "FLOW_CONTROL";
    PieceCategory["BUSINESS_INTELLIGENCE"] = "BUSINESS_INTELLIGENCE";
    PieceCategory["ACCOUNTING"] = "ACCOUNTING";
    PieceCategory["PRODUCTIVITY"] = "PRODUCTIVITY";
    PieceCategory["CONTENT_AND_FILES"] = "CONTENT_AND_FILES";
    PieceCategory["DEVELOPER_TOOLS"] = "DEVELOPER_TOOLS";
    PieceCategory["CUSTOMER_SUPPORT"] = "CUSTOMER_SUPPORT";
    PieceCategory["FORMS_AND_SURVEYS"] = "FORMS_AND_SURVEYS";
    PieceCategory["HUMAN_RESOURCES"] = "HUMAN_RESOURCES";
    PieceCategory["PAYMENT_PROCESSING"] = "PAYMENT_PROCESSING";
    PieceCategory["MARKETING"] = "MARKETING";
    PieceCategory["SALES_AND_CRM"] = "SALES_AND_CRM";
})(PieceCategory || (exports.PieceCategory = PieceCategory = {}));
//# sourceMappingURL=piece.js.map