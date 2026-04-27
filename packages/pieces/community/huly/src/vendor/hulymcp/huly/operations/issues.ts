/**
 * Issue domain operations — barrel re-export.
 *
 * Split into:
 * - issues-read: listIssues, getIssue
 * - issues-write: createIssue, updateIssue, deleteIssue
 * - issues-move: addLabel, moveIssue
 *
 * @module
 */
export { addLabel, moveIssue } from "./issues-move.js"
export { getIssue, listIssues } from "./issues-read.js"
export { createIssue, deleteIssue, updateIssue } from "./issues-write.js"
