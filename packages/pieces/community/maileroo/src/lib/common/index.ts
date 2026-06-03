import { ApFile } from "@activepieces/pieces-framework";
import { isNil } from "@activepieces/shared";

export function toEmailObjects(addresses: unknown[]) {
  return addresses
    .filter((addr): addr is string => typeof addr === 'string')
    .map((address) => ({ address }));
}

export function buildAttachmentList(attachments: Array<{ file: ApFile }>) {
  return attachments
    .filter(
      (item): item is { file: ApFile } =>
        typeof item === 'object' && !isNil(item) && 'file' in item,
    )
    .map(({ file }) => ({
      file_name: file.filename,
      content: file.base64,
    }));
}