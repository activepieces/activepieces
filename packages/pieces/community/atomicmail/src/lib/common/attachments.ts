import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ApFile } from '@activepieces/pieces-framework';
import type { JmapAttachmentInput } from '@atomicmail/agentic-core';

export interface TempAttachmentPaths {
  attachments: JmapAttachmentInput[];
  cleanup: () => void;
}

export function attachmentsFromApFiles(
  files: ApFile | ApFile[] | undefined,
): TempAttachmentPaths {
  if (!files) {
    return { attachments: [], cleanup: () => undefined };
  }

  const list = Array.isArray(files) ? files : [files];
  if (list.length === 0) {
    return { attachments: [], cleanup: () => undefined };
  }

  const dir = mkdtempSync(join(tmpdir(), 'atomicmail-attach-'));
  const attachments: JmapAttachmentInput[] = list.map((file, index) => {
    const filename = file.filename || `attachment-${index + 1}`;
    const path = join(dir, filename);
    writeFileSync(path, file.data);
    return { path, name: filename };
  });

  return {
    attachments,
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // non-fatal
      }
    },
  };
}
