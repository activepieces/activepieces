import { GqlConnection, GqlCount } from './graphql';

const MARKET_LIST_NESTED_LIMIT = 10;
const MARKET_LIST_WEB_PRESENCE_LIMIT = 5;
const MARKET_DETAIL_RELATIVES_LIMIT = 50;
const MARKET_DETAIL_REGIONS_LIMIT = 100;
const MARKET_DETAIL_CONDITION_LIMIT = 50;
const MARKET_DETAIL_CATALOGS_LIMIT = 10;
const MARKET_DETAIL_WEB_PRESENCE_LIMIT = 10;

const MARKET_REGION_NODE_FIELDS =
  'id name ... on MarketRegionCountry { countryCode: code } ... on MarketRegionSubdivision { subdivisionCode: code }';

const RETURN_POLICY_RULES_FIELDS =
  'returnRules { canAcceptReturns returnWindowDays returnWindowStartingFrom extendWindowToBusinessDay } editRules { canAcceptEdits editWindowMinutes }';

const RETURN_POLICY_PROFILE_FIELDS = `id name default updatedAt ${RETURN_POLICY_RULES_FIELDS} markets { id name handle }`;

const MARKET_RETURN_POLICY_PROFILE_FIELDS = `id name default updatedAt ${RETURN_POLICY_RULES_FIELDS}`;

const MARKET_SUMMARY_FIELDS = `id name handle status type parentMarkets(first: ${MARKET_LIST_NESTED_LIMIT}) { nodes { id name } pageInfo { hasNextPage } } childMarkets(first: ${MARKET_LIST_NESTED_LIMIT}) { nodes { id name } pageInfo { hasNextPage } } returnPolicyProfile { id name default } conditions { conditionTypes regionsCondition { applicationLevel regions(first: ${MARKET_LIST_NESTED_LIMIT}) { nodes { ${MARKET_REGION_NODE_FIELDS} } pageInfo { hasNextPage } } } } currencySettings { baseCurrency { currencyCode } localCurrencies } webPresences(first: ${MARKET_LIST_WEB_PRESENCE_LIMIT}) { nodes { id subfolderSuffix domain { host } } pageInfo { hasNextPage } }`;

const MARKET_DETAIL_FIELDS = `id name handle status type parentMarketsCount { count } childMarketsCount { count } parentMarkets(first: ${MARKET_DETAIL_RELATIVES_LIMIT}) { nodes { id name handle } pageInfo { hasNextPage } } childMarkets(first: ${MARKET_DETAIL_RELATIVES_LIMIT}) { nodes { id name handle } pageInfo { hasNextPage } } returnPolicyProfile { ${MARKET_RETURN_POLICY_PROFILE_FIELDS} } conditions { conditionTypes regionsCondition { applicationLevel regions(first: ${MARKET_DETAIL_REGIONS_LIMIT}) { nodes { ${MARKET_REGION_NODE_FIELDS} } pageInfo { hasNextPage } } } locationsCondition { applicationLevel locations(first: ${MARKET_DETAIL_CONDITION_LIMIT}) { nodes { id name } pageInfo { hasNextPage } } } companyLocationsCondition { applicationLevel companyLocations(first: ${MARKET_DETAIL_CONDITION_LIMIT}) { nodes { id name } pageInfo { hasNextPage } } } channelsCondition { applicationLevel channels(first: ${MARKET_DETAIL_CONDITION_LIMIT}) { nodes { id name } pageInfo { hasNextPage } } } } currencySettings { baseCurrency { currencyCode currencyName } localCurrencies roundingEnabled } priceInclusions { inclusiveTaxPricingStrategy inclusiveDutiesPricingStrategy } catalogsCount { count } catalogs(first: ${MARKET_DETAIL_CATALOGS_LIMIT}) { nodes { id title status priceList { id name currency } } pageInfo { hasNextPage } } webPresences(first: ${MARKET_DETAIL_WEB_PRESENCE_LIMIT}) { nodes { id subfolderSuffix domain { host } defaultLocale { locale } rootUrls { locale url } } pageInfo { hasNextPage } }`;

const MARKET_RELATIONSHIP_FIELDS = 'id parentMarket { id name handle } childMarket { id name handle }';

function nodesOf<TNode>(connection: GqlConnection<TNode> | null | undefined): TNode[] {
  return connection?.nodes ?? [];
}

function isTruncated(connection: GqlConnection<unknown> | null | undefined): boolean {
  return connection?.pageInfo?.hasNextPage ?? false;
}

function mapNamedRefs(connection: GqlConnection<GqlNamedRef> | null | undefined) {
  return nodesOf(connection).map((node) => ({
    id: node.id,
    name: node.name ?? null,
  }));
}

function mapMarketRefs(connection: GqlConnection<GqlNamedRef> | null | undefined) {
  return nodesOf(connection).map((node) => ({
    id: node.id,
    name: node.name ?? null,
    handle: node.handle ?? null,
  }));
}

function mapRegions(connection: GqlConnection<GqlMarketRegion> | null | undefined) {
  return nodesOf(connection).map((region) => ({
    id: region.id,
    name: region.name ?? null,
    code: region.countryCode ?? region.subdivisionCode ?? null,
  }));
}

function mapReturnPolicyRules(profile: GqlReturnPolicyProfile) {
  const returnRules = profile.returnRules ?? null;
  const editRules = profile.editRules ?? null;
  return {
    return_rules_enabled: returnRules !== null,
    can_accept_returns: returnRules?.canAcceptReturns ?? null,
    return_window_days: returnRules?.returnWindowDays ?? null,
    return_window_starting_from: returnRules?.returnWindowStartingFrom ?? null,
    extend_window_to_business_day: returnRules?.extendWindowToBusinessDay ?? null,
    edit_rules_enabled: editRules !== null,
    can_accept_edits: editRules?.canAcceptEdits ?? null,
    edit_window_minutes: editRules?.editWindowMinutes ?? null,
  };
}

function mapReturnPolicyProfile(profile: GqlReturnPolicyProfile) {
  return {
    id: profile.id,
    name: profile.name ?? null,
    is_default: profile.default ?? null,
    updated_at: profile.updatedAt ?? null,
    ...mapReturnPolicyRules(profile),
    markets: (profile.markets ?? []).map((market) => ({
      id: market.id,
      name: market.name ?? null,
      handle: market.handle ?? null,
    })),
  };
}

function mapMarketSummary(market: GqlMarket) {
  const regions = market.conditions?.regionsCondition?.regions;
  return {
    id: market.id,
    name: market.name ?? null,
    handle: market.handle ?? null,
    status: market.status ?? null,
    type: market.type ?? null,
    condition_types: market.conditions?.conditionTypes ?? [],
    region_application_level: market.conditions?.regionsCondition?.applicationLevel ?? null,
    regions: mapRegions(regions),
    regions_truncated: isTruncated(regions),
    parent_markets: mapNamedRefs(market.parentMarkets),
    parent_markets_truncated: isTruncated(market.parentMarkets),
    child_markets: mapNamedRefs(market.childMarkets),
    child_markets_truncated: isTruncated(market.childMarkets),
    return_policy_profile_id: market.returnPolicyProfile?.id ?? null,
    return_policy_profile_name: market.returnPolicyProfile?.name ?? null,
    return_policy_profile_is_default: market.returnPolicyProfile?.default ?? null,
    base_currency_code: market.currencySettings?.baseCurrency?.currencyCode ?? null,
    local_currencies: market.currencySettings?.localCurrencies ?? null,
    web_presences: nodesOf(market.webPresences).map((presence) => ({
      id: presence.id,
      subfolder_suffix: presence.subfolderSuffix ?? null,
      domain_host: presence.domain?.host ?? null,
    })),
    web_presences_truncated: isTruncated(market.webPresences),
  };
}

function mapMarketDetail(market: GqlMarket) {
  const conditions = market.conditions;
  const regions = conditions?.regionsCondition?.regions;
  const locations = conditions?.locationsCondition?.locations;
  const companyLocations = conditions?.companyLocationsCondition?.companyLocations;
  const channels = conditions?.channelsCondition?.channels;
  const profile = market.returnPolicyProfile;
  return {
    id: market.id,
    name: market.name ?? null,
    handle: market.handle ?? null,
    status: market.status ?? null,
    type: market.type ?? null,
    condition_types: conditions?.conditionTypes ?? [],
    region_application_level: conditions?.regionsCondition?.applicationLevel ?? null,
    regions: mapRegions(regions),
    regions_truncated: isTruncated(regions),
    location_application_level: conditions?.locationsCondition?.applicationLevel ?? null,
    locations: mapNamedRefs(locations),
    locations_truncated: isTruncated(locations),
    company_location_application_level: conditions?.companyLocationsCondition?.applicationLevel ?? null,
    company_locations: mapNamedRefs(companyLocations),
    company_locations_truncated: isTruncated(companyLocations),
    channel_application_level: conditions?.channelsCondition?.applicationLevel ?? null,
    channels: mapNamedRefs(channels),
    channels_truncated: isTruncated(channels),
    parent_markets_count: market.parentMarketsCount?.count ?? null,
    parent_markets: mapMarketRefs(market.parentMarkets),
    parent_markets_truncated: isTruncated(market.parentMarkets),
    child_markets_count: market.childMarketsCount?.count ?? null,
    child_markets: mapMarketRefs(market.childMarkets),
    child_markets_truncated: isTruncated(market.childMarkets),
    base_currency_code: market.currencySettings?.baseCurrency?.currencyCode ?? null,
    base_currency_name: market.currencySettings?.baseCurrency?.currencyName ?? null,
    local_currencies: market.currencySettings?.localCurrencies ?? null,
    rounding_enabled: market.currencySettings?.roundingEnabled ?? null,
    inclusive_tax_pricing_strategy: market.priceInclusions?.inclusiveTaxPricingStrategy ?? null,
    inclusive_duties_pricing_strategy: market.priceInclusions?.inclusiveDutiesPricingStrategy ?? null,
    catalogs_count: market.catalogsCount?.count ?? null,
    catalogs: nodesOf(market.catalogs).map((catalog) => ({
      id: catalog.id,
      title: catalog.title ?? null,
      status: catalog.status ?? null,
      price_list_id: catalog.priceList?.id ?? null,
      price_list_name: catalog.priceList?.name ?? null,
      price_list_currency: catalog.priceList?.currency ?? null,
    })),
    catalogs_truncated: isTruncated(market.catalogs),
    web_presences: nodesOf(market.webPresences).map((presence) => ({
      id: presence.id,
      subfolder_suffix: presence.subfolderSuffix ?? null,
      domain_host: presence.domain?.host ?? null,
      default_locale: presence.defaultLocale?.locale ?? null,
      root_urls: (presence.rootUrls ?? []).map((root) => ({
        locale: root.locale ?? null,
        url: root.url ?? null,
      })),
    })),
    web_presences_truncated: isTruncated(market.webPresences),
    return_policy_profile_id: profile?.id ?? null,
    return_policy_profile_name: profile?.name ?? null,
    return_policy_profile_is_default: profile?.default ?? null,
    return_policy: profile ? mapReturnPolicyRules(profile) : null,
  };
}

function mapMarketRelationship(relationship: GqlMarketRelationship) {
  return {
    id: relationship.id,
    parent_market_id: relationship.parentMarket?.id ?? null,
    parent_market_name: relationship.parentMarket?.name ?? null,
    parent_market_handle: relationship.parentMarket?.handle ?? null,
    child_market_id: relationship.childMarket?.id ?? null,
    child_market_name: relationship.childMarket?.name ?? null,
    child_market_handle: relationship.childMarket?.handle ?? null,
  };
}

const MARKET_TYPES = ['REGION', 'LOCATION', 'COMPANY_LOCATION', 'CHANNEL', 'NONE'];

const MARKET_SORT_KEYS = [
  'NAME',
  'CREATED_AT',
  'UPDATED_AT',
  'STATUS',
  'MARKET_TYPE',
  'MARKET_CONDITION_TYPES',
  'ID',
];

export const marketsFields = {
  MARKET_SUMMARY_FIELDS,
  MARKET_DETAIL_FIELDS,
  MARKET_RELATIONSHIP_FIELDS,
  RETURN_POLICY_PROFILE_FIELDS,
  MARKET_TYPES,
  MARKET_SORT_KEYS,
};

export const marketsMappers = {
  mapMarketSummary,
  mapMarketDetail,
  mapMarketRelationship,
  mapReturnPolicyProfile,
};

type GqlNamedRef = {
  id: string;
  name?: string | null;
  handle?: string | null;
};

type GqlMarketRegion = {
  id: string;
  name?: string | null;
  countryCode?: string | null;
  subdivisionCode?: string | null;
};

export type GqlReturnPolicyProfile = {
  id: string;
  name?: string | null;
  default?: boolean | null;
  updatedAt?: string | null;
  returnRules?: {
    canAcceptReturns?: boolean | null;
    returnWindowDays?: number | null;
    returnWindowStartingFrom?: string | null;
    extendWindowToBusinessDay?: boolean | null;
  } | null;
  editRules?: {
    canAcceptEdits?: boolean | null;
    editWindowMinutes?: number | null;
  } | null;
  markets?: GqlNamedRef[] | null;
};

export type GqlMarket = {
  id: string;
  name?: string | null;
  handle?: string | null;
  status?: string | null;
  type?: string | null;
  parentMarketsCount?: GqlCount | null;
  childMarketsCount?: GqlCount | null;
  parentMarkets?: GqlConnection<GqlNamedRef> | null;
  childMarkets?: GqlConnection<GqlNamedRef> | null;
  returnPolicyProfile?: GqlReturnPolicyProfile | null;
  conditions?: {
    conditionTypes?: string[] | null;
    regionsCondition?: {
      applicationLevel?: string | null;
      regions?: GqlConnection<GqlMarketRegion> | null;
    } | null;
    locationsCondition?: {
      applicationLevel?: string | null;
      locations?: GqlConnection<GqlNamedRef> | null;
    } | null;
    companyLocationsCondition?: {
      applicationLevel?: string | null;
      companyLocations?: GqlConnection<GqlNamedRef> | null;
    } | null;
    channelsCondition?: {
      applicationLevel?: string | null;
      channels?: GqlConnection<GqlNamedRef> | null;
    } | null;
  } | null;
  currencySettings?: {
    baseCurrency?: { currencyCode?: string | null; currencyName?: string | null } | null;
    localCurrencies?: boolean | null;
    roundingEnabled?: boolean | null;
  } | null;
  priceInclusions?: {
    inclusiveTaxPricingStrategy?: string | null;
    inclusiveDutiesPricingStrategy?: string | null;
  } | null;
  catalogsCount?: GqlCount | null;
  catalogs?: GqlConnection<{
    id: string;
    title?: string | null;
    status?: string | null;
    priceList?: { id: string; name?: string | null; currency?: string | null } | null;
  }> | null;
  webPresences?: GqlConnection<{
    id: string;
    subfolderSuffix?: string | null;
    domain?: { host?: string | null } | null;
    defaultLocale?: { locale?: string | null } | null;
    rootUrls?: { locale?: string | null; url?: string | null }[] | null;
  }> | null;
};

export type GqlMarketRelationship = {
  id: string;
  parentMarket?: GqlNamedRef | null;
  childMarket?: GqlNamedRef | null;
};
