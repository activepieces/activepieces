/**
 * File/storage domain errors.
 *
 * @module
 */
import { Schema } from "effect"

export const BYTES_PER_MB = 1024 * 1024

/**
 * File upload error - storage operation failed.
 */
export class FileUploadError extends Schema.TaggedError<FileUploadError>()(
  "FileUploadError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect)
  }
) {}

/**
 * Invalid file data error - e.g., malformed base64.
 */
export class InvalidFileDataError extends Schema.TaggedError<InvalidFileDataError>()(
  "InvalidFileDataError",
  {
    message: Schema.String
  }
) {}

/**
 * File not found at specified path.
 */
export class FileNotFoundError extends Schema.TaggedError<FileNotFoundError>()(
  "FileNotFoundError",
  {
    filePath: Schema.String
  }
) {
  override get message(): string {
    return `File not found: ${this.filePath}`
  }
}

/**
 * Failed to fetch file from URL.
 */
export class FileFetchError extends Schema.TaggedError<FileFetchError>()(
  "FileFetchError",
  {
    fileUrl: Schema.String,
    reason: Schema.String
  }
) {
  override get message(): string {
    return `Failed to fetch file from ${this.fileUrl}: ${this.reason}`
  }
}

/**
 * Attachment not found.
 */
export class AttachmentNotFoundError extends Schema.TaggedError<AttachmentNotFoundError>()(
  "AttachmentNotFoundError",
  {
    attachmentId: Schema.String
  }
) {
  override get message(): string {
    return `Attachment '${this.attachmentId}' not found`
  }
}

/**
 * File size exceeds maximum allowed.
 */
export class FileTooLargeError extends Schema.TaggedError<FileTooLargeError>()(
  "FileTooLargeError",
  {
    filename: Schema.String,
    size: Schema.Number,
    maxSize: Schema.Number
  }
) {
  override get message(): string {
    const DECIMAL_PLACES = 2
    const sizeMB = (this.size / BYTES_PER_MB).toFixed(DECIMAL_PLACES)
    const maxMB = (this.maxSize / BYTES_PER_MB).toFixed(0)
    return `File '${this.filename}' is too large (${sizeMB}MB). Maximum allowed: ${maxMB}MB`
  }
}

/**
 * Invalid content type for file upload.
 */
export class InvalidContentTypeError extends Schema.TaggedError<InvalidContentTypeError>()(
  "InvalidContentTypeError",
  {
    filename: Schema.String,
    contentType: Schema.String
  }
) {
  override get message(): string {
    return `Invalid content type '${this.contentType}' for file '${this.filename}'`
  }
}
