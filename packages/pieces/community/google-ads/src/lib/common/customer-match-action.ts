import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi } from './client';
import type { GoogleAdsAuthValue } from './client';
import { buildMemberBatches } from './customer-match';
import type { AudienceMemberPayload, ConsentStatus, MemberInput } from './customer-match';
import { DataManagerApi, MEMBERS_PER_REQUEST, REQUEST_STATUS_URL, destinationFor, userListIdFrom } from './data-manager';
import type {
  DataManagerConsent,
  DataManagerConsentStatus,
  Destination,
  FieldWarning,
  IngestResponse,
  ReasonCount,
  RequestStatusPerDestination,
} from './data-manager';
import { readField } from './resources';

export async function userListOptions({ auth, customerId }: { auth: GoogleAdsAuthValue | undefined; customerId: unknown }): Promise<DropdownState<string>> {
  if (!auth?.access_token) {
    return { disabled: true, options: [], placeholder: 'Please select an existing or create a new connection.' };
  }
  if (!customerId) {
    return { disabled: true, options: [], placeholder: 'Please select a customer.' };
  }
  try {
    const page = await GoogleAdsApi.search({
      auth,
      customerId: String(customerId),
      query:
        "SELECT user_list.resource_name, user_list.id, user_list.name, user_list.crm_based_user_list.upload_key_type FROM user_list WHERE user_list.type = 'CRM_BASED' ORDER BY user_list.name",
    });
    const options = (page.results ?? []).map((row) => ({
      label: `${String(readField({ row, gaqlPath: 'user_list.name' }) ?? '')} (${String(readField({ row, gaqlPath: 'user_list.crm_based_user_list.upload_key_type' }) ?? 'CRM')})`,
      value: String(readField({ row, gaqlPath: 'user_list.resource_name' }) ?? ''),
    }));
    if (options.length === 0) {
      return { disabled: true, options: [], placeholder: 'No CRM-based audience list in this account. Create one first (Create Record, Audience list).' };
    }
    return { disabled: false, options };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { disabled: true, options: [], placeholder: `An error occurred while listing the audience lists: ${detail.slice(0, 300)}` };
  }
}

export function toDataManagerConsent(consent: { adUserData: ConsentStatus; adPersonalization: ConsentStatus }): DataManagerConsent {
  return { adUserData: CONSENT[consent.adUserData], adPersonalization: CONSENT[consent.adPersonalization] };
}

export function aggregateStatus(statuses: string[]): string {
  if (statuses.length === 0 || statuses.some((s) => !FINAL_STATUSES.has(s))) return 'PROCESSING';
  if (statuses.every((s) => s === 'SUCCESS')) return 'SUCCESS';
  if (statuses.every((s) => s === 'FAILED')) return 'FAILED';
  return 'PARTIAL_SUCCESS';
}

export async function uploadCustomerMatch(params: UploadCustomerMatchParams): Promise<CustomerMatchResult> {
  const { batches, identifiers } = buildMemberBatches({ members: params.members, limit: MEMBERS_PER_REQUEST });
  const destination = destinationFor({ auth: params.auth, customerId: params.customerId, userList: params.userList });

  const requestIds: string[] = [];
  const fieldWarnings: FieldWarning[] = [];
  for (const [index, audienceMembers] of batches.entries()) {
    try {
      const answer = await sendBatch({ params, destination, audienceMembers });
      if (answer.requestId) requestIds.push(answer.requestId);
      if (Array.isArray(answer.fieldWarnings)) fieldWarnings.push(...answer.fieldWarnings);
    } catch (error) {
      if (requestIds.length === 0) throw error;
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Batch ${index + 1} of ${batches.length} failed: ${reason}. Google already accepted requests ${requestIds.join(', ')} for the earlier batches; ${STATUS_CHECK_HINT} before retrying, since a retry sends those batches again.`
      );
    }
  }

  const outcome =
    params.waitForCompletion && requestIds.length > 0
      ? await waitForAcceptedRequests({ auth: params.auth, requestIds })
      : { status: 'PROCESSING', matchRateRange: undefined, errors: [], warnings: [] };

  return {
    requestIds,
    userList: params.userList,
    userListId: userListIdFrom({ userList: params.userList, customerId: params.customerId }),
    mode: params.mode,
    members: params.members.length,
    identifiers,
    requests: batches.length,
    status: outcome.status,
    ...(outcome.matchRateRange ? { matchRateRange: outcome.matchRateRange } : {}),
    errors: outcome.errors,
    warnings: outcome.warnings,
    fieldWarnings,
  };
}

async function sendBatch({
  params,
  destination,
  audienceMembers,
}: {
  params: UploadCustomerMatchParams;
  destination: Destination;
  audienceMembers: AudienceMemberPayload[];
}): Promise<IngestResponse> {
  if (params.mode === 'add') {
    return DataManagerApi.ingestAudienceMembers({
      auth: params.auth,
      body: {
        destinations: [destination],
        audienceMembers,
        consent: toDataManagerConsent(params.consent),
        encoding: 'HEX',
        termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' },
      },
    });
  }
  return DataManagerApi.removeAudienceMembers({
    auth: params.auth,
    body: {
      destinations: [destination],
      audienceMembers,
      encoding: 'HEX',
    },
  });
}

async function waitForAcceptedRequests({ auth, requestIds }: { auth: GoogleAdsAuthValue; requestIds: string[] }): Promise<RequestOutcome> {
  try {
    return await waitForRequests({ auth, requestIds });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Google accepted requests ${requestIds.join(', ')}, but checking their status failed: ${reason}. The upload itself went through and running this step again would send the members again; ${STATUS_CHECK_HINT} instead.`
    );
  }
}


async function waitForRequests({ auth, requestIds }: { auth: GoogleAdsAuthValue; requestIds: string[] }): Promise<RequestOutcome> {
  let perRequest: RequestStatusPerDestination[][] = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await sleep(10_000);
    const answers = await Promise.all(
      requestIds.map((requestId) => DataManagerApi.retrieveRequestStatus({ auth, requestId }))
    );
    perRequest = answers.map((r) => r.requestStatusPerDestination ?? []);
    if (perRequest.every((d) => FINAL_STATUSES.has(statusOf(d)))) {
      break;
    }
  }
  const destinations = perRequest.flat();
  return {
    status: aggregateStatus(perRequest.flatMap((d) => (d.length === 0 ? ['PROCESSING'] : d.map((one) => one.requestStatus ?? 'PROCESSING')))),
    matchRateRange: destinations.reduce<string | undefined>(
      (range, d) => d.audienceMembersIngestionStatus?.userDataIngestionStatus?.uploadMatchRateRange ?? range,
      undefined
    ),
    errors: destinations.flatMap((d) => d.errorInfo?.errorCounts ?? []),
    warnings: destinations.flatMap((d) => d.warningInfo?.warningCounts ?? []),
  };
}

function consentOptions(): { label: string; value: ConsentStatus }[] {
  return [
    { label: 'Granted', value: 'GRANTED' },
    { label: 'Denied', value: 'DENIED' },
    { label: 'Unspecified', value: 'UNSPECIFIED' },
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusOf(destinations: RequestStatusPerDestination[]): string {
  return aggregateStatus(destinations.map((d) => d.requestStatus ?? 'PROCESSING'));
}

const CONSENT: Record<ConsentStatus, DataManagerConsentStatus> = {
  GRANTED: 'CONSENT_GRANTED',
  DENIED: 'CONSENT_DENIED',
  UNSPECIFIED: 'CONSENT_STATUS_UNSPECIFIED',
};

const FINAL_STATUSES = new Set(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED']);

const STATUS_CHECK_HINT = `check each request with Custom API Call: method GET, URL ${REQUEST_STATUS_URL}?requestId=<request id>`;

export const userListProp = Property.Dropdown<string, true, typeof googleAdsAuth>({
  displayName: 'Audience List',
  description: 'CRM-based audience list (Customer Match) the members go to.',
  required: true,
  auth: googleAdsAuth,
  refreshers: ['customerId'],
  options: async ({ auth, customerId }) => userListOptions({ auth, customerId }),
});

export const membersProp = Property.Array({
  displayName: 'Members',
  description:
    'One entry per person. Fill any of: e-mail, phone (E.164, e.g. +5511999999999), or the full address set (first name, last name, country code, postal code). Values are normalized and SHA-256 hashed before upload.',
  required: true,
  properties: {
    email: Property.ShortText({ displayName: 'E-mail', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    countryCode: Property.ShortText({ displayName: 'Country Code', description: 'ISO 3166-1 alpha-2, e.g. BR', required: false }),
    postalCode: Property.ShortText({ displayName: 'Postal Code', required: false }),
  },
});

export const consentAdUserDataProp = Property.StaticDropdown<ConsentStatus, true>({
  displayName: 'Consent: Ad User Data',
  description: 'Consent the members gave for their data to be used for advertising (required by Google for uploads, enforced in the EEA).',
  required: true,
  defaultValue: 'GRANTED',
  options: { options: consentOptions() },
});

export const consentAdPersonalizationProp = Property.StaticDropdown<ConsentStatus, true>({
  displayName: 'Consent: Ad Personalization',
  description: 'Consent the members gave for personalized advertising.',
  required: true,
  defaultValue: 'GRANTED',
  options: { options: consentOptions() },
});

export const acceptTermsProp = Property.Checkbox({
  displayName: 'Customer Match Terms Accepted',
  description:
    'Google requires every upload to confirm that the advertiser accepted the Customer Match terms of service (https://support.google.com/adspolicy/answer/6299717). Tick to confirm.',
  required: true,
  defaultValue: false,
});

export const waitForCompletionProp = Property.Checkbox({
  displayName: 'Wait for Processing',
  description: 'Poll the request status for up to ~2 minutes. Matching usually takes longer, so this is off by default: the output carries the request ids to check later.',
  required: false,
  defaultValue: false,
});

export type CustomerMatchResult = {
  requestIds: string[];
  userList: string;
  userListId: string;
  mode: 'add' | 'remove';
  members: number;
  identifiers: number;
  requests: number;
  status: string;
  matchRateRange?: string;
  errors: ReasonCount[];
  warnings: ReasonCount[];
  fieldWarnings: FieldWarning[];
};

export type UploadCustomerMatchParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  userList: string;
  members: MemberInput[];
  mode: 'add' | 'remove';
  consent: { adUserData: ConsentStatus; adPersonalization: ConsentStatus };
  waitForCompletion: boolean;
};

type RequestOutcome = {
  status: string;
  matchRateRange: string | undefined;
  errors: ReasonCount[];
  warnings: ReasonCount[];
};
