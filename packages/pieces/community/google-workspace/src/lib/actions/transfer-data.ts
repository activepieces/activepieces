import { createAction, Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { DATA_TRANSFER_PATH } from '../common/client';
import type { ResolvedAuth } from '../common/client';
import { DataTransferApi, userProfileId } from '../common/data-transfer';
import type { ApplicationDataTransfer, DataTransfer, TransferApplication, TransferParam } from '../common/data-transfer';
import { resolveAuth } from '../common/token';
import type { GoogleWorkspaceAuthValue } from '../common/token';
import { transferDataOutputSchema } from '../output-schemas';

export async function applicationOptions(auth: GoogleWorkspaceAuthValue | undefined): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Please select an existing or create a new connection.' };
  }
  try {
    const applications = await DataTransferApi.listApplications(await resolveAuth(auth));
    if (applications.length === 0) {
      return { disabled: true, options: [], placeholder: 'No application supports data transfer in this account.' };
    }
    return { disabled: false, options: applications.map((app) => ({ label: labelFor(app), value: String(app.id) })) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      disabled: true,
      options: [],
      placeholder: `An error occurred while listing the transferable applications: ${detail.slice(0, 300)}`,
    };
  }
}

export function toTransferParams(value: unknown): TransferParam[] {
  const entries = isRecord(value) ? Object.entries(value) : [];
  return entries
    .map(([key, raw]) => ({
      key: key.trim(),
      value: (Array.isArray(raw) ? raw : String(raw ?? '').split(','))
        .map((v) => String(v).trim())
        .filter(Boolean),
    }))
    .filter((p) => p.key && p.value.length > 0);
}

function labelFor(app: TransferApplication): string {
  const params = (app.transferParams ?? []).map((p) => `${p.key}: ${p.value.join('|')}`).join(', ');
  return params ? `${app.name} (${params})` : app.name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilDone({
  auth,
  transfer,
  transferId,
  deadline,
}: {
  auth: ResolvedAuth;
  transfer: DataTransfer;
  transferId: string;
  deadline: number;
}): Promise<DataTransfer> {
  let latest = transfer;
  while (isRunning(latest) && Date.now() < deadline) {
    await sleep(Math.min(POLL_INTERVAL_MS, deadline - Date.now()));
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return latest;
    }
    try {
      latest = await DataTransferApi.getTransfer({ auth, transferId, timeoutMs: remaining });
    } catch (error) {
      if (Date.now() < deadline) {
        throw new Error(
          `Transfer ${transferId} was started in Google and was not cancelled, but checking its status failed: ${error instanceof Error ? error.message : String(error)}. Check it with Custom API Call (GET /${DATA_TRANSFER_PATH}/transfers/${transferId}) before running this step again.`,
          { cause: error }
        );
      }
      return latest;
    }
  }
  return latest;
}

function isRunning(transfer: DataTransfer): boolean {
  return RUNNING_STATUSES.includes(transfer.overallTransferStatusCode ?? '');
}

function assertNotFailed({ transfer, requireCompleted }: { transfer: DataTransfer; requireCompleted: boolean }): void {
  const status = transfer.overallTransferStatusCode ?? 'unknown';
  const failed = (transfer.applicationDataTransfers ?? []).filter((a) => a.applicationTransferStatus === FAILED_STATUS);
  const overallFailed = requireCompleted ? status !== COMPLETED_STATUS : status === FAILED_STATUS;
  if (!overallFailed && failed.length === 0) {
    return;
  }
  const applications = failed.map((a) => `application ${a.applicationId}: ${FAILED_STATUS}`).join(', ');
  const transferId = transfer.id ?? 'without id';
  throw new Error(
    `Transfer ${transferId} did not complete in Google (status: ${status}${applications ? `; ${applications}` : ''}). The data of From User may not have moved, so do not delete that user yet. Check the details with Custom API Call (GET /${DATA_TRANSFER_PATH}/transfers/${transferId}) and start a new transfer once the cause is fixed.`
  );
}

function shape(transfer: DataTransfer) {
  return {
    transferId: transfer.id ?? null,
    status: transfer.overallTransferStatusCode ?? null,
    oldOwnerUserId: transfer.oldOwnerUserId,
    newOwnerUserId: transfer.newOwnerUserId,
    requestTime: transfer.requestTime ?? null,
    applications: (transfer.applicationDataTransfers ?? []).map((a) => ({
      applicationId: a.applicationId,
      status: a.applicationTransferStatus ?? null,
      params: a.applicationTransferParams ?? [],
    })),
  };
}

const COMPLETED_STATUS = 'completed';
const FAILED_STATUS = 'failed';
const RUNNING_STATUSES = ['inProgress', 'pending'];
const POLL_INTERVAL_MS = 10_000;
const POLL_WAIT_MS = 120_000;
const POLL_WAIT_SECONDS = POLL_WAIT_MS / 1000;

export const transferData = createAction({
  name: 'transferData',
  classification: 'WRITE',
  displayName: 'Transfer Data',
  description: "Transfer a user's application data (Drive files, Calendar events, ...) to another user, e.g. when offboarding",
  audience: 'both',
  aiMetadata: {
    description:
      "Starts a Google Workspace data transfer that moves one application's data (Drive files, Calendar events, Looker Studio assets, ...) from one user to another, typically when offboarding. Both users must exist; the source may be suspended. Each call starts a new transfer, so do not retry a successful call.",
    idempotent: false,
  },
  errorHandlingOptions: {
    continueOnFailure: { defaultValue: false },
    retryOnFailure: { defaultValue: false, hide: true },
  },
  auth: googleWorkspaceAuth,
  props: {
    oldOwner: Property.ShortText({
      displayName: 'From User',
      description: 'E-mail or id of the user whose data moves. The user must still exist (suspended is fine).',
      required: true,
    }),
    newOwner: Property.ShortText({
      displayName: 'To User',
      description: 'E-mail or id of the user receiving the data.',
      required: true,
    }),
    applicationId: Property.Dropdown<string, true, typeof googleWorkspaceAuth>({
      displayName: 'Application',
      description: "Which application's data to transfer. The label lists the parameters the application accepts.",
      required: true,
      auth: googleWorkspaceAuth,
      refreshers: [],
      options: async ({ auth }) => applicationOptions(auth),
    }),
    transferParams: Property.Object({
      displayName: 'Transfer Parameters',
      description:
        "Parameter key to value(s), comma-separated for several. Drive: `PRIVACY_LEVEL` = `SHARED,PRIVATE` (which files); Calendar: `RELEASE_RESOURCES` = `TRUE` (free the old owner's rooms/resources). Leave empty for the application's default.",
      required: false,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: `Poll the transfer for up to ${POLL_WAIT_SECONDS} seconds and return its final status; the step fails if it is still running by then or did not complete. Off: return right after Google accepts it.`,
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: transferDataOutputSchema,
  async run(context) {
    const { oldOwner, newOwner, applicationId, transferParams, waitForCompletion } = context.propsValue;
    const auth = await resolveAuth(context.auth);

    const [oldOwnerUserId, newOwnerUserId] = await Promise.all([
      userProfileId({ auth, userKey: oldOwner }),
      userProfileId({ auth, userKey: newOwner }),
    ]);
    if (oldOwnerUserId === newOwnerUserId) {
      throw new Error('From User and To User are the same account.');
    }

    const params = toTransferParams(transferParams);
    const application: ApplicationDataTransfer = {
      applicationId: String(applicationId),
      ...(params.length > 0 ? { applicationTransferParams: params } : {}),
    };

    let transfer = await DataTransferApi.createTransfer({
      auth,
      transfer: {
        oldOwnerUserId,
        newOwnerUserId,
        applicationDataTransfers: [application],
      },
    });

    const transferId = transfer.id;
    if (waitForCompletion && transferId) {
      transfer = await pollUntilDone({ auth, transfer, transferId, deadline: Date.now() + POLL_WAIT_MS });
      if (isRunning(transfer)) {
        throw new Error(
          `Transfer ${transferId} is still running in Google after waiting ${POLL_WAIT_SECONDS} seconds. It was not cancelled and will finish on its own. Check its status with Custom API Call (GET /${DATA_TRANSFER_PATH}/transfers/${transferId}), or turn Wait for Completion off to continue as soon as Google accepts the transfer.`
        );
      }
    }
    assertNotFailed({ transfer, requireCompleted: Boolean(waitForCompletion && transferId) });

    return shape(transfer);
  },
});
