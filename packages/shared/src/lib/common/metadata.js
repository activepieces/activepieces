"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metadata = void 0;
const typebox_1 = require("@sinclair/typebox");
/**
 * Flexible key-value record type for storing arbitrary data
 *
 * The Metadata type provides a flexible way to store additional information
 * on various entities without requiring schema changes. It can be used for:
 * - Custom categorization
 * - Integration with external systems
 * - Environment-specific configurations
 * - Analytics and tracking information
 *
 * @example
 * // Example metadata for a project
 * const metadata = {
 *   department: "marketing",
 *   priority: 1,
 *   customField: "customValue"
 * }
 */
exports.Metadata = typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown());
//# sourceMappingURL=metadata.js.map