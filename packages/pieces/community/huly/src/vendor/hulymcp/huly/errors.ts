/**
 * Error hierarchy for Huly MCP server — barrel re-export.
 *
 * Split into domain modules:
 * - errors-base: HulyError, HulyConnectionError, HulyAuthError
 * - errors-tracker: issue, project, status, milestone, component, template errors
 * - errors-contacts: PersonNotFoundError, InvalidPersonUuidError
 * - errors-files: file upload/fetch/size errors, BYTES_PER_MB
 * - errors-documents: teamspace, document errors
 * - errors-messaging: channel, message, thread, reaction errors
 * - errors-calendar: event errors
 * - errors-cards: card space, card, master tag errors
 * - errors-labels: tag, tag category errors
 * - errors-test-management: test project/suite/case/plan/run/result errors
 * - errors-notifications: notification errors
 *
 * @module
 */
import { Schema } from "effect"

import { HulyAuthError, HulyConnectionError, HulyError } from "./errors-base.js"
import { EventNotFoundError, RecurringEventNotFoundError } from "./errors-calendar.js"
import { CardNotFoundError, CardSpaceNotFoundError, MasterTagNotFoundError } from "./errors-cards.js"
import { InvalidPersonUuidError, PersonNotFoundError } from "./errors-contacts.js"
import {
  DocumentEmptyContentError,
  DocumentNotFoundError,
  DocumentTextMultipleMatchesError,
  DocumentTextNotFoundError,
  TeamspaceNotFoundError
} from "./errors-documents.js"
import {
  AttachmentNotFoundError,
  BYTES_PER_MB,
  FileFetchError,
  FileNotFoundError,
  FileTooLargeError,
  FileUploadError,
  InvalidContentTypeError,
  InvalidFileDataError
} from "./errors-files.js"
import { TagCategoryNotFoundError, TagNotFoundError } from "./errors-labels.js"
import {
  ActivityMessageNotFoundError,
  ChannelNotFoundError,
  MessageNotFoundError,
  ReactionNotFoundError,
  SavedMessageNotFoundError,
  ThreadReplyNotFoundError
} from "./errors-messaging.js"
import { NotificationContextNotFoundError, NotificationNotFoundError } from "./errors-notifications.js"
import {
  TestCaseNotFoundError,
  TestPlanItemNotFoundError,
  TestPlanNotFoundError,
  TestProjectNotFoundError,
  TestResultNotFoundError,
  TestRunNotFoundError,
  TestSuiteNotFoundError
} from "./errors-test-management.js"
import {
  CommentNotFoundError,
  ComponentNotFoundError,
  InvalidStatusError,
  IssueNotFoundError,
  IssueTemplateNotFoundError,
  MilestoneNotFoundError,
  ProjectNotFoundError,
  TemplateChildNotFoundError
} from "./errors-tracker.js"

export {
  ActivityMessageNotFoundError,
  AttachmentNotFoundError,
  BYTES_PER_MB,
  CardNotFoundError,
  CardSpaceNotFoundError,
  ChannelNotFoundError,
  CommentNotFoundError,
  ComponentNotFoundError,
  DocumentEmptyContentError,
  DocumentNotFoundError,
  DocumentTextMultipleMatchesError,
  DocumentTextNotFoundError,
  EventNotFoundError,
  FileFetchError,
  FileNotFoundError,
  FileTooLargeError,
  FileUploadError,
  HulyAuthError,
  HulyConnectionError,
  HulyError,
  InvalidContentTypeError,
  InvalidFileDataError,
  InvalidPersonUuidError,
  InvalidStatusError,
  IssueNotFoundError,
  IssueTemplateNotFoundError,
  MasterTagNotFoundError,
  MessageNotFoundError,
  MilestoneNotFoundError,
  NotificationContextNotFoundError,
  NotificationNotFoundError,
  PersonNotFoundError,
  ProjectNotFoundError,
  ReactionNotFoundError,
  RecurringEventNotFoundError,
  SavedMessageNotFoundError,
  TagCategoryNotFoundError,
  TagNotFoundError,
  TeamspaceNotFoundError,
  TemplateChildNotFoundError,
  TestCaseNotFoundError,
  TestPlanItemNotFoundError,
  TestPlanNotFoundError,
  TestProjectNotFoundError,
  TestResultNotFoundError,
  TestRunNotFoundError,
  TestSuiteNotFoundError,
  ThreadReplyNotFoundError
}

/**
 * Union of all Huly domain errors.
 */
export type HulyDomainError =
  | HulyError
  | HulyConnectionError
  | HulyAuthError
  | IssueNotFoundError
  | ProjectNotFoundError
  | InvalidStatusError
  | PersonNotFoundError
  | FileUploadError
  | InvalidFileDataError
  | FileNotFoundError
  | FileFetchError
  | TeamspaceNotFoundError
  | DocumentNotFoundError
  | DocumentTextNotFoundError
  | DocumentTextMultipleMatchesError
  | DocumentEmptyContentError
  | CommentNotFoundError
  | MilestoneNotFoundError
  | ChannelNotFoundError
  | MessageNotFoundError
  | ThreadReplyNotFoundError
  | EventNotFoundError
  | RecurringEventNotFoundError
  | ActivityMessageNotFoundError
  | ReactionNotFoundError
  | SavedMessageNotFoundError
  | AttachmentNotFoundError
  | CardSpaceNotFoundError
  | CardNotFoundError
  | MasterTagNotFoundError
  | TagNotFoundError
  | TagCategoryNotFoundError
  | TestProjectNotFoundError
  | TestSuiteNotFoundError
  | TestCaseNotFoundError
  | TestPlanNotFoundError
  | TestRunNotFoundError
  | TestResultNotFoundError
  | TestPlanItemNotFoundError
  | ComponentNotFoundError
  | IssueTemplateNotFoundError
  | TemplateChildNotFoundError
  | NotificationNotFoundError
  | NotificationContextNotFoundError
  | InvalidPersonUuidError
  | FileTooLargeError
  | InvalidContentTypeError

/**
 * Schema for all Huly domain errors (for serialization).
 */
export const HulyDomainError: Schema.Union<
  [
    typeof HulyError,
    typeof HulyConnectionError,
    typeof HulyAuthError,
    typeof IssueNotFoundError,
    typeof ProjectNotFoundError,
    typeof InvalidStatusError,
    typeof PersonNotFoundError,
    typeof FileUploadError,
    typeof InvalidFileDataError,
    typeof FileNotFoundError,
    typeof FileFetchError,
    typeof TeamspaceNotFoundError,
    typeof DocumentNotFoundError,
    typeof DocumentTextNotFoundError,
    typeof DocumentTextMultipleMatchesError,
    typeof DocumentEmptyContentError,
    typeof CommentNotFoundError,
    typeof MilestoneNotFoundError,
    typeof ChannelNotFoundError,
    typeof MessageNotFoundError,
    typeof ThreadReplyNotFoundError,
    typeof EventNotFoundError,
    typeof RecurringEventNotFoundError,
    typeof ActivityMessageNotFoundError,
    typeof ReactionNotFoundError,
    typeof SavedMessageNotFoundError,
    typeof AttachmentNotFoundError,
    typeof CardSpaceNotFoundError,
    typeof CardNotFoundError,
    typeof MasterTagNotFoundError,
    typeof TagNotFoundError,
    typeof TagCategoryNotFoundError,
    typeof TestProjectNotFoundError,
    typeof TestSuiteNotFoundError,
    typeof TestCaseNotFoundError,
    typeof TestPlanNotFoundError,
    typeof TestRunNotFoundError,
    typeof TestResultNotFoundError,
    typeof TestPlanItemNotFoundError,
    typeof ComponentNotFoundError,
    typeof IssueTemplateNotFoundError,
    typeof TemplateChildNotFoundError,
    typeof NotificationNotFoundError,
    typeof NotificationContextNotFoundError,
    typeof InvalidPersonUuidError,
    typeof FileTooLargeError,
    typeof InvalidContentTypeError
  ]
> = Schema.Union(
  HulyError,
  HulyConnectionError,
  HulyAuthError,
  IssueNotFoundError,
  ProjectNotFoundError,
  InvalidStatusError,
  PersonNotFoundError,
  FileUploadError,
  InvalidFileDataError,
  FileNotFoundError,
  FileFetchError,
  TeamspaceNotFoundError,
  DocumentNotFoundError,
  DocumentTextNotFoundError,
  DocumentTextMultipleMatchesError,
  DocumentEmptyContentError,
  CommentNotFoundError,
  MilestoneNotFoundError,
  ChannelNotFoundError,
  MessageNotFoundError,
  ThreadReplyNotFoundError,
  EventNotFoundError,
  RecurringEventNotFoundError,
  ActivityMessageNotFoundError,
  ReactionNotFoundError,
  SavedMessageNotFoundError,
  AttachmentNotFoundError,
  CardSpaceNotFoundError,
  CardNotFoundError,
  MasterTagNotFoundError,
  TagNotFoundError,
  TagCategoryNotFoundError,
  TestProjectNotFoundError,
  TestSuiteNotFoundError,
  TestCaseNotFoundError,
  TestPlanNotFoundError,
  TestRunNotFoundError,
  TestResultNotFoundError,
  TestPlanItemNotFoundError,
  ComponentNotFoundError,
  IssueTemplateNotFoundError,
  TemplateChildNotFoundError,
  NotificationNotFoundError,
  NotificationContextNotFoundError,
  InvalidPersonUuidError,
  FileTooLargeError,
  InvalidContentTypeError
)
