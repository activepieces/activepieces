export type GoogleAdsAuthValue = {
  access_token: string;
  props?: { loginCustomerId?: string | undefined } | undefined;
};

export type GoogleAdsEntity = {
  resourceName?: string;
  id?: string;
  name?: string;
  status?: string;
  type?: string;
};

export type GoogleAdsCustomer = {
  id?: string;
  descriptiveName?: string;
  manager?: boolean;
  testAccount?: boolean;
  status?: string;
};

export type GoogleAdsChangeEvent = {
  resourceName?: string;
  changeDateTime?: string;
  changeResourceName?: string;
};

export type GoogleAdsRow = {
  campaign?: GoogleAdsEntity;
  adGroup?: GoogleAdsEntity;
  adGroupAd?: GoogleAdsEntity & { ad?: GoogleAdsEntity };
  adGroupCriterion?: GoogleAdsEntity & { criterionId?: string };
  userList?: GoogleAdsEntity & { crmBasedUserList?: { uploadKeyType?: string } };
  customer?: GoogleAdsCustomer;
  customerClient?: GoogleAdsCustomer;
  changeEvent?: GoogleAdsChangeEvent;
  [key: string]: unknown;
};

export type GoogleAdsSearchPage = {
  results?: GoogleAdsRow[];
  nextPageToken?: string;
};

export type GoogleAdsSearchAllResult = { results: GoogleAdsRow[]; truncated: boolean };

export type GoogleAdsMutateResponse = {
  mutateOperationResponses?: Record<string, ({ resourceName?: string } & Record<string, unknown>) | undefined>[];
};

export type GoogleAdsCustomerInfo = {
  id: string;
  descriptiveName?: string;
  manager?: boolean;
  testAccount?: boolean;
  status?: string;
};

export type GoogleAdsResourceType = 'campaign' | 'ad_group' | 'ad_group_ad' | 'ad_group_criterion' | 'user_list';

export type GoogleAdsResourceDefinition = {
  type: GoogleAdsResourceType;
  label: string;
  operationKey: string;
  resultKey: string;
  collection: string;
  idField: string;
  fields: string[];
  kind?: { field: string; value: string };
  statusField?: string;
  compositeIdHint?: string;
  changeEventType?: string;
  createExample: Record<string, unknown>;
  read: (row: GoogleAdsRow) => GoogleAdsEntity | undefined;
};

export type GoogleAdsRecordOperation =
  | { create: Record<string, unknown> }
  | { update: Record<string, unknown>; updateMask: string }
  | { remove: string };

export type GoogleAdsRecordMutationResult = {
  resourceType: string;
  resourceName: string | null;
  id: string | null;
  record: Record<string, unknown> | null;
  validateOnly: boolean;
};

export type GoogleAdsReportResource = 'customer' | 'campaign' | 'ad_group' | 'ad_group_ad' | 'keyword_view' | 'search_term_view';

export type GoogleAdsDateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_14_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_WEEK_SUN_TODAY'
  | 'THIS_WEEK_MON_TODAY'
  | 'LAST_WEEK_SUN_SAT'
  | 'LAST_WEEK_MON_SUN'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_BUSINESS_WEEK'
  | 'CUSTOM'
  | 'ALL_TIME';

export type GoogleAdsReportSpec = {
  resource: GoogleAdsReportResource;
  fields?: string[];
  metrics?: string[];
  dateRange?: GoogleAdsDateRangePreset;
  startDate?: string;
  endDate?: string;
  segmentByDate?: boolean;
  where?: string;
  orderBy?: string;
};

export type GoogleAdsMemberInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  postalCode?: string;
};

export type GoogleAdsUserIdentifier =
  | { emailAddress: string }
  | { phoneNumber: string }
  | { address: { givenName: string; familyName: string; regionCode: string; postalCode: string } };

export type GoogleAdsAudienceMember = { userData: { userIdentifiers: GoogleAdsUserIdentifier[] } };

export type GoogleAdsConsentStatus = 'GRANTED' | 'DENIED' | 'UNSPECIFIED';

export type GoogleAdsDestination = {
  operatingAccount: { accountType: 'GOOGLE_ADS'; accountId: string };
  loginAccount?: { accountType: 'GOOGLE_ADS'; accountId: string };
  productDestinationId: string;
};

export type GoogleAdsFieldWarning = { reason?: string; description?: string; field?: string };

export type GoogleAdsIngestResponse = { requestId?: string; fieldWarnings?: GoogleAdsFieldWarning[] };

export type GoogleAdsReasonCount = { recordCount?: string; reason?: string };

export type GoogleAdsRequestStatusPerDestination = {
  requestStatus?: string;
  errorInfo?: { errorCounts?: GoogleAdsReasonCount[] };
  warningInfo?: { warningCounts?: GoogleAdsReasonCount[] };
  audienceMembersIngestionStatus?: { userDataIngestionStatus?: { uploadMatchRateRange?: string } };
};

export type GoogleAdsRequestStatusResponse = { requestStatusPerDestination?: GoogleAdsRequestStatusPerDestination[] };

export type GoogleAdsCustomerMatchRequest = { requestId: string; status: string; matchRateRange?: string };

export type GoogleAdsCustomerMatchResult = {
  requestIds: string[];
  userList: string;
  userListId: string;
  mode: 'add' | 'remove';
  members: number;
  identifiers: number;
  status: string;
  requests: GoogleAdsCustomerMatchRequest[];
  errors: GoogleAdsReasonCount[];
  warnings: GoogleAdsReasonCount[];
  fieldWarnings: GoogleAdsFieldWarning[];
};

export type GoogleAdsUploadParams = {
  customerId: string;
  userList: string;
  members: GoogleAdsMemberInput[];
  waitForCompletion: boolean;
} & ({ mode: 'add'; consent: { adUserData: GoogleAdsConsentStatus; adPersonalization: GoogleAdsConsentStatus } } | { mode: 'remove' });
