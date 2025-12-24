import { Static } from '@sinclair/typebox';
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
export declare const Metadata: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
export type Metadata = Static<typeof Metadata>;
