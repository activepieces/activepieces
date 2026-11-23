import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon, BlobSummary } from '../common/client';
import { newOrUpdatedBlobOutputSchema } from '../output-schemas';

const STORE_KEY = 'azure_blob_new_or_updated_checkpoint';
const SCAN_CAP = 10000;
const TEST_ITEMS = 5;

function blobKey(blob: { name: string; etag: string | null }): string {
  return `${blob.name}|${blob.etag ?? ''}`;
}

function blobTime(blob: BlobSummary): number {
  return blob.lastModified ? Date.parse(blob.lastModified) : Number.NaN;
}

async function scanBlobs({
  connectionString,
  container,
  prefix,
}: {
  connectionString: string;
  container: string;
  prefix: string | undefined;
}): Promise<BlobSummary[]> {
  const client = await azureBlobCommon.getServiceClient({ connectionString });
  const containerClient = client.getContainerClient(container);
  const scan = await azureBlobCommon.callAzure({
    operation: 'list blobs',
    isWrite: false,
    request: async () => {
      const blobs: BlobSummary[] = [];
      for await (const page of containerClient
        .listBlobsFlat({ includeMetadata: true, prefix })
        .byPage({ maxPageSize: 5000 })) {
        for (const item of page.segment.blobItems) {
          blobs.push(azureBlobCommon.mapBlobItem(item));
        }
        if (blobs.length > SCAN_CAP) {
          return { blobs, capped: true };
        }
      }
      return { blobs, capped: false };
    },
  });
  if (scan.capped) {
    throw new Error(
      `Azure Blob trigger stopped: more than ${SCAN_CAP} blobs match this container and prefix. Narrow the Prefix so at most ${SCAN_CAP} blobs are watched.`
    );
  }
  return scan.blobs;
}

function computeChanges({
  blobs,
  checkpoint,
}: {
  blobs: BlobSummary[];
  checkpoint: Checkpoint;
}): { emitted: BlobSummary[]; next: Checkpoint } {
  const seen = new Set(checkpoint.boundaryKeys);
  const dated = blobs.filter((blob) => Number.isFinite(blobTime(blob)));
  const emitted = dated
    .filter((blob) => {
      const time = blobTime(blob);
      return (
        time > checkpoint.lastModifiedMs ||
        (time === checkpoint.lastModifiedMs && !seen.has(blobKey(blob)))
      );
    })
    .sort((a, b) => blobTime(a) - blobTime(b));
  let maxTime = checkpoint.lastModifiedMs;
  for (const blob of dated) {
    const time = blobTime(blob);
    if (time > maxTime) {
      maxTime = time;
    }
  }
  const boundary = dated.filter((blob) => blobTime(blob) === maxTime).map(blobKey);
  const boundaryKeys =
    maxTime === checkpoint.lastModifiedMs
      ? Array.from(new Set([...checkpoint.boundaryKeys, ...boundary]))
      : boundary;
  return { emitted, next: { lastModifiedMs: maxTime, boundaryKeys } };
}

export const newOrUpdatedBlob = createTrigger({
  auth: azureBlobStorageAuth,
  name: 'new_or_updated_blob',
  displayName: 'New or Updated Blob',
  description:
    'Triggers when a blob is created, overwritten, or has its metadata or properties changed in a container (Azure updates Last-Modified for all of these). Do not set metadata or properties on the triggering blob inside the same flow, or the flow will re-trigger itself in a loop; write to a different prefix instead. The container (or prefix) must not hold more than 10,000 blobs.',
  aiMetadata: {
    description:
      'Fires for each blob in the configured container (and optional prefix) that is created, overwritten, or has its metadata or properties changed, based on its Last-Modified time and ETag. Each payload is one blob: container, name, size, content type, last-modified and created times, ETag, access tier, blob type, version id and metadata. Metadata-only changes also fire it, so a flow that sets metadata on the triggering blob loops; write results under a different prefix. The watched container or prefix must hold at most 10,000 blobs.',
  },
  classification: 'READ',
  type: TriggerStrategy.POLLING,
  outputSchema: newOrUpdatedBlobOutputSchema,
  props: {
    container: containerProp,
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Only watch blobs whose name starts with this text, e.g. "incoming/".',
      required: false,
    }),
  },
  sampleData: {
    container: 'invoices',
    name: 'incoming/invoice-1001.pdf',
    size: 48213,
    contentType: 'application/pdf',
    lastModified: '2026-11-23T10:15:02.000Z',
    createdOn: '2026-11-23T10:15:02.000Z',
    etag: '0x8DD0B1C2D3E4F50',
    accessTier: 'Hot',
    blobType: 'BlockBlob',
    versionId: null,
    snapshot: null,
    metadata: {},
  },
  async onEnable(context) {
    if (context.isRepublish) {
      const existing = await context.store.get<Checkpoint>(STORE_KEY);
      if (existing) {
        return;
      }
    }
    const blobs = await scanBlobs({
      connectionString: context.auth.props.connectionString,
      container: context.propsValue.container,
      prefix: azureBlobCommon.emptyToUndefined(context.propsValue.prefix),
    });
    const { next } = computeChanges({
      blobs,
      checkpoint: { lastModifiedMs: 0, boundaryKeys: [] },
    });
    await context.store.put<Checkpoint>(STORE_KEY, next);
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async run(context) {
    const container = context.propsValue.container;
    const blobs = await scanBlobs({
      connectionString: context.auth.props.connectionString,
      container,
      prefix: azureBlobCommon.emptyToUndefined(context.propsValue.prefix),
    });
    const stored = await context.store.get<Checkpoint>(STORE_KEY);
    const checkpoint = stored ?? { lastModifiedMs: Date.now(), boundaryKeys: [] };
    const { emitted, next } = computeChanges({ blobs, checkpoint });
    await context.store.put<Checkpoint>(STORE_KEY, next);
    return emitted.map((blob) => ({ container, ...blob }));
  },
  async test(context) {
    const container = context.propsValue.container;
    const blobs = await scanBlobs({
      connectionString: context.auth.props.connectionString,
      container,
      prefix: azureBlobCommon.emptyToUndefined(context.propsValue.prefix),
    });
    return blobs
      .filter((blob) => Number.isFinite(blobTime(blob)))
      .sort((a, b) => blobTime(b) - blobTime(a))
      .slice(0, TEST_ITEMS)
      .map((blob) => ({ container, ...blob }));
  },
});

export const newOrUpdatedBlobInternals = { computeChanges, scanBlobs, STORE_KEY, SCAN_CAP };

type Checkpoint = {
  lastModifiedMs: number;
  boundaryKeys: string[];
};
