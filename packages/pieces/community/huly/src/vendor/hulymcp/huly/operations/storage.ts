/**
 * Storage operations for Huly MCP server.
 *
 * Provides file upload functionality with multiple input sources:
 * - filePath: Local file (preferred - no context flooding)
 * - fileUrl: Remote URL (server fetches)
 * - data: Base64 (fallback for small files)
 *
 * @module
 */
import { Effect } from "effect"

import type { UploadFileParams } from "../../domain/schemas.js"
import { assertExists } from "../../utils/assertions.js"
import { type FileFetchError, type FileNotFoundError, type InvalidFileDataError } from "../errors.js"
import {
  decodeBase64,
  fetchFromUrl,
  HulyStorageClient,
  readFromFilePath,
  type StorageClientError,
  type UploadFileResult
} from "../storage.js"

type UploadFileError = StorageClientError | InvalidFileDataError | FileNotFoundError | FileFetchError

/**
 * Upload a file to Huly storage.
 *
 * Accepts file data from one of three sources (priority order):
 * 1. filePath - Read from local filesystem (preferred)
 * 2. fileUrl - Fetch from remote URL
 * 3. data - Base64 encoded (fallback for small files)
 *
 * @param params - Upload parameters including filename, content type, and one data source
 * @returns Upload result with blob ID and access URL
 */
export const uploadFile = (
  params: UploadFileParams
): Effect.Effect<UploadFileResult, UploadFileError, HulyStorageClient> =>
  Effect.gen(function*() {
    const storageClient = yield* HulyStorageClient

    // Get file buffer from one of the sources (priority: filePath > fileUrl > data)
    // Schema guarantees at least one source exists
    const buffer: Buffer = params.filePath
      ? yield* readFromFilePath(params.filePath)
      : params.fileUrl
      ? yield* fetchFromUrl(params.fileUrl)
      : yield* decodeBase64(assertExists(params.data, "data required when no filePath/fileUrl"))

    // Upload to storage
    const result = yield* storageClient.uploadFile(
      params.filename,
      buffer,
      params.contentType
    )

    return result
  })

/**
 * Get the URL for accessing a file by its blob ID.
 */
export const getFileUrl = (
  blobId: string
): Effect.Effect<string, never, HulyStorageClient> =>
  Effect.gen(function*() {
    const storageClient = yield* HulyStorageClient
    return storageClient.getFileUrl(blobId)
  })
