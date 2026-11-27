import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function greipEnvelope({ data }: { data: OutputSchemaField[] }): OutputSchemaField[] {
  return [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'data', label: 'Result', children: data },
    { key: 'execution_ms', label: 'Processing Time (ms)', format: 'number' },
  ];
}

const ipFields: OutputSchemaField = {
  key: 'ip',
  label: 'IP',
  children: [
    { key: 'address', label: 'IP Address' },
    { key: 'version', label: 'IP Version', format: 'number' },
    { key: 'numeric', label: 'Numeric IP', format: 'number' },
    { key: 'bogon', label: 'Is Bogon', format: 'boolean' },
  ],
};

const continentAndCountryFields: OutputSchemaField[] = [
  { key: 'continent', label: 'Continent' },
  { key: 'continent_code', label: 'Continent Code' },
  { key: 'continent_geo_name_id', label: 'Continent GeoNames ID', format: 'number' },
  { key: 'country', label: 'Country' },
  { key: 'country_code', label: 'Country Code' },
  { key: 'country_geo_name_id', label: 'Country GeoNames ID', format: 'number' },
];

const languageFields: OutputSchemaField = {
  key: 'language',
  label: 'Language',
  children: [
    { key: 'name', label: 'Language' },
    { key: 'code', label: 'Language Code' },
    { key: 'native', label: 'Native Name' },
  ],
};

const flagFields: OutputSchemaField = {
  key: 'flag',
  label: 'Flag',
  children: [
    { key: 'emoji', label: 'Flag Emoji' },
    { key: 'unicode', label: 'Flag Unicode' },
    {
      key: 'png',
      label: 'Flag PNG',
      children: [
        { key: '1000px', label: 'Flag PNG (1000px)', format: 'image' },
        { key: '250px', label: 'Flag PNG (250px)', format: 'image' },
        { key: '100px', label: 'Flag PNG (100px)', format: 'image' },
      ],
    },
    { key: 'svg', label: 'Flag SVG', format: 'image' },
  ],
};

const countryDetailFields: OutputSchemaField[] = [
  { key: 'phone', label: 'Phone Code' },
  { key: 'is_eu', label: 'In EU', format: 'boolean' },
  { key: 'neighbours', label: 'Neighbouring Countries' },
  { key: 'tld', label: 'Top-Level Domain' },
];

const currencyFields: OutputSchemaField = {
  key: 'currency',
  label: 'Currency',
  children: [
    { key: 'name', label: 'Currency' },
    { key: 'code', label: 'Currency Code' },
    { key: 'symbol', label: 'Currency Symbol' },
  ],
};

const securityFields: OutputSchemaField = {
  key: 'security',
  label: 'Security',
  children: [
    { key: 'vpn_or_proxy', label: 'VPN or Proxy', format: 'boolean' },
    { key: 'vpn_or_proxy_type', label: 'VPN or Proxy Type' },
    { key: 'tor', label: 'Tor', format: 'boolean' },
    { key: 'bot', label: 'Bot', format: 'boolean' },
    { key: 'relay', label: 'Relay', format: 'boolean' },
    { key: 'relay_country', label: 'Relay Country' },
    { key: 'relay_city', label: 'Relay City' },
    { key: 'hosting', label: 'Hosting', format: 'boolean' },
    { key: 'is_blacklisted', label: 'Blacklisted', format: 'boolean' },
  ],
};

const customRulesFields: OutputSchemaField = {
  key: 'custom_rules_applied',
  label: 'Custom Rules Applied',
  children: [
    { key: 'total', label: 'Custom Rules Matched', format: 'number' },
    { key: 'rules', label: 'Custom Rules' },
  ],
};

const matchedRulesFields: OutputSchemaField = {
  key: 'rules',
  label: 'Matched Rules',
  labelKey: 'id',
  listItems: [
    { key: 'id', label: 'Rule ID' },
    { key: 'description', label: 'Rule Description' },
  ],
};

const riskFields: OutputSchemaField[] = [
  { key: 'risk_level', label: 'Risk Level' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'reasons', label: 'Reasons' },
  matchedRulesFields,
];

const domainFields: OutputSchemaField[] = [
  { key: 'name', label: 'Domain' },
  { key: 'is_dangerous', label: 'Dangerous', format: 'boolean' },
  { key: 'is_disposable', label: 'Disposable', format: 'boolean' },
  { key: 'is_forwarding', label: 'Forwarding', format: 'boolean' },
  { key: 'is_spf', label: 'Has SPF', format: 'boolean' },
  { key: 'is_dmarc', label: 'Has DMARC', format: 'boolean' },
  { key: 'is_dkim', label: 'Has DKIM', format: 'boolean' },
  { key: 'is_mx', label: 'Has MX', format: 'boolean' },
  { key: 'is_bimi', label: 'Has BIMI', format: 'boolean' },
  { key: 'created_at', label: 'Registered', format: 'date' },
  { key: 'is_new', label: 'Newly Registered', format: 'boolean' },
];

const ipLookupDataFields: OutputSchemaField[] = [
  ipFields,
  {
    key: 'geo',
    label: 'Geolocation',
    children: [
      ...continentAndCountryFields,
      { key: 'region', label: 'Region' },
      { key: 'city', label: 'City' },
      { key: 'postal', label: 'Postal Code' },
      { key: 'latitude', label: 'Latitude', format: 'number' },
      { key: 'longitude', label: 'Longitude', format: 'number' },
    ],
  },
  {
    key: 'location',
    label: 'Location',
    children: [
      { key: 'capital', label: 'Capital' },
      { key: 'population', label: 'Population', format: 'number' },
      languageFields,
      flagFields,
      ...countryDetailFields,
    ],
  },
  currencyFields,
  {
    key: 'asn',
    label: 'ASN',
    children: [
      { key: 'number', label: 'AS Number' },
      { key: 'name', label: 'AS Name' },
      { key: 'cidr', label: 'CIDR' },
      { key: 'org', label: 'Organization' },
      { key: 'phone', label: 'Organization Phone' },
      { key: 'email', label: 'Organization Email', format: 'email' },
      { key: 'domain', label: 'Organization Domain' },
      { key: 'created', label: 'Created', format: 'date' },
      { key: 'type', label: 'AS Type' },
    ],
  },
  {
    key: 'timezone',
    label: 'Timezone',
    children: [
      { key: 'name', label: 'Timezone' },
      { key: 'abbreviation', label: 'Timezone Abbreviation' },
      { key: 'offset', label: 'UTC Offset (seconds)', format: 'number' },
      { key: 'current_time', label: 'Current Local Time' },
      { key: 'current_timestamp', label: 'Current Timestamp', format: 'number' },
      { key: 'is_dst', label: 'Daylight Saving Time', format: 'boolean' },
      {
        key: 'sun_info',
        label: 'Sun Info',
        children: [
          { key: 'sunset', label: 'Sunset' },
          { key: 'sunrise', label: 'Sunrise' },
          { key: 'transit', label: 'Solar Noon' },
          { key: 'civil_twilight_begin', label: 'Civil Twilight Begin' },
          { key: 'civil_twilight_end', label: 'Civil Twilight End' },
          { key: 'nautical_twilight_begin', label: 'Nautical Twilight Begin' },
          { key: 'nautical_twilight_end', label: 'Nautical Twilight End' },
          { key: 'astronomical_twilight_begin', label: 'Astronomical Twilight Begin' },
          { key: 'astronomical_twilight_end', label: 'Astronomical Twilight End' },
          { key: 'day_length', label: 'Day Length' },
        ],
      },
    ],
  },
  securityFields,
  {
    key: 'device',
    label: 'Device',
    children: [
      { key: 'mobile', label: 'Mobile', children: [{ key: 'detected', label: 'Is Mobile', format: 'boolean' }] },
      { key: 'type', label: 'Device Type' },
      {
        key: 'os',
        label: 'Operating System',
        children: [
          { key: 'type', label: 'OS Type' },
          { key: 'name', label: 'OS Name' },
          { key: 'family', label: 'OS Family' },
          { key: 'version', label: 'OS Version' },
          { key: 'title', label: 'OS Title' },
          { key: 'bits64', label: '64-bit' },
        ],
      },
      {
        key: 'browser',
        label: 'Browser',
        children: [
          { key: 'name', label: 'Browser Name' },
          { key: 'version', label: 'Browser Version' },
          { key: 'version_major', label: 'Browser Major Version' },
          { key: 'title', label: 'Browser Title' },
        ],
      },
    ],
  },
  customRulesFields,
];

export const greipDeleteUserDataOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'transaction_data', label: 'Transactions Deleted', format: 'number' },
      { key: 'ips', label: 'IPs Deleted', format: 'number' },
      { key: 'profanity_data', label: 'Profanity Records Deleted', format: 'number' },
      { key: 'emails', label: 'Emails Deleted', format: 'number' },
      { key: 'phone_numbers', label: 'Phone Numbers Deleted', format: 'number' },
      { key: 'ibans', label: 'IBANs Deleted', format: 'number' },
    ],
  }),
};

export const greipDetectProfanityOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'risk_level', label: 'Risk Level' },
      { key: 'recommendation', label: 'Recommendation' },
    ],
  }),
};

export const greipGetCountryOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      {
        key: 'geo',
        label: 'Country',
        children: [
          ...continentAndCountryFields,
          { key: 'capital', label: 'Capital' },
          { key: 'population', label: 'Population', format: 'number' },
          ...countryDetailFields,
        ],
      },
      languageFields,
      flagFields,
      currencyFields,
      customRulesFields,
    ],
  }),
};

export const greipLookupIpOutputSchema: OutputSchema = {
  fields: greipEnvelope({ data: ipLookupDataFields }),
};

export const greipScoreIpOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      ipFields,
      { key: 'score', label: 'Threat Score', format: 'number' },
      { key: 'risk_level', label: 'Risk Level' },
      { key: 'recommendation', label: 'Recommendation' },
      matchedRulesFields,
      securityFields,
      customRulesFields,
    ],
  }),
};

export const ipLookupOutputSchema: OutputSchema = {
  fields: greipEnvelope({ data: ipLookupDataFields }),
};

export const greipBulkLookupIpsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'data', label: 'IP Results', dynamicKey: true, labelKey: 'ip.address', children: ipLookupDataFields },
    { key: 'execution_ms', label: 'Processing Time (ms)', format: 'number' },
  ],
};

export const greipAsnOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'number', label: 'AS Number' },
      { key: 'name', label: 'AS Name' },
      { key: 'org', label: 'Organization' },
      { key: 'phone', label: 'Organization Phone' },
      { key: 'email', label: 'Organization Email', format: 'email' },
      { key: 'domain', label: 'Organization Domain' },
      { key: 'status', label: 'Status' },
      { key: 'created', label: 'Created', format: 'datetime' },
      { key: 'type', label: 'AS Type' },
      { key: 'registry', label: 'Registry' },
      { key: 'country_code', label: 'Country Code' },
      {
        key: 'prefixes',
        label: 'Prefixes',
        children: [
          { key: 'ipv4', label: 'IPv4 Prefixes' },
          { key: 'ipv6', label: 'IPv6 Prefixes' },
          { key: 'total', label: 'Total Prefixes', format: 'number' },
        ],
      },
    ],
  }),
};

export const greipBinOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'bin', label: 'BIN' },
      { key: 'is_valid', label: 'Is Valid', format: 'boolean' },
      { key: 'reason', label: 'Invalid Reason' },
      { key: 'is_blacklisted', label: 'Blacklisted', format: 'boolean' },
      {
        key: 'scheme',
        label: 'Card Scheme',
        children: [
          { key: 'name', label: 'Scheme' },
          { key: 'is_luhn', label: 'Passes Luhn Check', format: 'boolean' },
          { key: 'is_prepaid', label: 'Prepaid', format: 'boolean' },
          { key: 'is_commercial', label: 'Commercial', format: 'boolean' },
          { key: 'type', label: 'Card Type' },
          { key: 'brand', label: 'Card Brand' },
          { key: 'currency', label: 'Card Currency' },
        ],
      },
      { key: 'detected_digits', label: 'Detected Digits' },
      {
        key: 'syntax',
        label: 'Card Number Syntax',
        children: [
          { key: 'gaps', label: 'Digit Gaps' },
          { key: 'lengths', label: 'Valid Lengths' },
          {
            key: 'code',
            label: 'Security Code',
            children: [
              { key: 'name', label: 'Security Code Name' },
              { key: 'size', label: 'Security Code Length', format: 'number' },
            ],
          },
        ],
      },
      {
        key: 'bank',
        label: 'Issuing Bank',
        children: [
          { key: 'id', label: 'Bank ID' },
          { key: 'name', label: 'Bank Name' },
          { key: 'city', label: 'Bank City' },
          { key: 'url', label: 'Bank Website', format: 'url' },
          { key: 'phone', label: 'Bank Phone' },
          { key: 'latitude', label: 'Bank Latitude' },
          { key: 'longitude', label: 'Bank Longitude' },
        ],
      },
      {
        key: 'country',
        label: 'Issuing Country',
        children: [
          { key: 'alpha2', label: 'Country Code' },
          { key: 'name', label: 'Country' },
          { key: 'code', label: 'Phone Code' },
          { key: 'numeric', label: 'Numeric Country Code' },
          { key: 'emoji', label: 'Flag Emoji' },
          { key: 'continent', label: 'Continent' },
          { key: 'language_code', label: 'Language Code' },
          { key: 'language_native', label: 'Native Language' },
        ],
      },
    ],
  }),
};

export const greipIbanOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'is_valid', label: 'Is Valid', format: 'boolean' },
      { key: 'iban', label: 'IBAN' },
      {
        key: 'formats',
        label: 'Formats',
        children: [
          { key: 'machine', label: 'Machine Format' },
          { key: 'human', label: 'Human Format' },
          { key: 'obfuscated', label: 'Obfuscated' },
        ],
      },
      {
        key: 'country',
        label: 'Country',
        children: [
          { key: 'name', label: 'Country' },
          { key: 'iana', label: 'IANA Code' },
          { key: 'iso3166', label: 'Country Code' },
          { key: 'currency', label: 'Currency Code' },
          {
            key: 'central_bank',
            label: 'Central Bank',
            children: [
              { key: 'url', label: 'Central Bank Website', format: 'url' },
              { key: 'name', label: 'Central Bank' },
            ],
          },
          { key: 'membership', label: 'EU Membership' },
          { key: 'is_eu', label: 'In EU', format: 'boolean' },
          { key: 'length', label: 'IBAN Length', format: 'number' },
          { key: 'is_sepa', label: 'In SEPA', format: 'boolean' },
          { key: 'swift_official', label: 'Official SWIFT Member', format: 'boolean' },
        ],
      },
      {
        key: 'bank',
        label: 'Bank',
        children: [
          { key: 'identifier', label: 'Bank Identifier (BIC)' },
          { key: 'name', label: 'Bank Name' },
          { key: 'short_name', label: 'Bank Short Name' },
          { key: 'branch_code', label: 'Branch Code' },
          { key: 'bban', label: 'BBAN' },
        ],
      },
    ],
  }),
};

export const greipDomainOutputSchema: OutputSchema = {
  fields: greipEnvelope({ data: domainFields }),
};

export const greipEmailOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'is_valid', label: 'Is Valid', format: 'boolean' },
      { key: 'is_free', label: 'Free Provider', format: 'boolean' },
      { key: 'is_role_based', label: 'Role-Based', format: 'boolean' },
      { key: 'is_educational', label: 'Educational', format: 'boolean' },
      { key: 'is_disposable', label: 'Disposable', format: 'boolean' },
      { key: 'is_blacklisted', label: 'Blacklisted', format: 'boolean' },
      {
        key: 'domain',
        label: 'Domain',
        children: [
          ...domainFields,
          { key: 'domain_age_days', label: 'Domain Age (days)', format: 'number' },
          { key: 'has_website', label: 'Has Website', format: 'boolean' },
          { key: 'mx_provider_class', label: 'Mail Provider Class' },
        ],
      },
      ...riskFields,
      customRulesFields,
    ],
  }),
};

export const greipPhoneOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'phone', label: 'Phone' },
      { key: 'country_code', label: 'Country Code' },
      { key: 'carrier', label: 'Carrier' },
      { key: 'is_valid', label: 'Is Valid', format: 'boolean' },
      { key: 'is_blacklisted', label: 'Blacklisted', format: 'boolean' },
      { key: 'is_disposable', label: 'Disposable', format: 'boolean' },
      ...riskFields,
      customRulesFields,
    ],
  }),
};

export const greipPaymentOutputSchema: OutputSchema = {
  fields: greipEnvelope({
    data: [
      { key: 'score', label: 'Fraud Score', format: 'number' },
      { key: 'risk_level', label: 'Risk Level' },
      { key: 'recommendation', label: 'Recommendation' },
      matchedRulesFields,
      { key: 'rules_checked', label: 'Rules Checked', format: 'number' },
      { key: 'rules_detected', label: 'Rules Detected', format: 'number' },
      {
        key: 'velocity',
        label: 'Velocity',
        children: [
          { key: 'ip_24h_count', label: 'Payments From IP (24h)', format: 'number' },
          { key: 'ip_7d_count', label: 'Payments From IP (7d)', format: 'number' },
          { key: 'email_24h_count', label: 'Payments From Email (24h)', format: 'number' },
          { key: 'email_7d_count', label: 'Payments From Email (7d)', format: 'number' },
          { key: 'phone_24h_count', label: 'Payments From Phone (24h)', format: 'number' },
          { key: 'phone_7d_count', label: 'Payments From Phone (7d)', format: 'number' },
        ],
      },
      customRulesFields,
    ],
  }),
};

export const proxyConnectionDetectedOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    { key: 'ip', label: 'IP Address' },
    { key: 'ipType', label: 'IP Type' },
    { key: 'IPNumber', label: 'Numeric IP', format: 'number' },
    { key: 'countryCode', label: 'Country Code' },
    { key: 'countryGeoNameID', label: 'Country GeoNames ID', format: 'number' },
    { key: 'countryName', label: 'Country' },
    {
      key: 'security',
      label: 'Security',
      children: [
        { key: 'isProxy', label: 'Proxy', format: 'boolean' },
        { key: 'proxyType', label: 'Proxy Type' },
        { key: 'isTor', label: 'Tor', format: 'boolean' },
        { key: 'isBot', label: 'Bot', format: 'boolean' },
        { key: 'isRelay', label: 'Relay', format: 'boolean' },
        { key: 'isHosting', label: 'Hosting', format: 'boolean' },
      ],
    },
  ],
};

export const fraudulentPaymentDetectedOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'customer_email', label: 'Customer Email', format: 'email' },
    { key: 'customer_phone', label: 'Customer Phone' },
    { key: 'score', label: 'Fraud Score', format: 'number' },
    matchedRulesFields,
    { key: 'rulesChecked', label: 'Rules Checked', format: 'number' },
    { key: 'rulesDetected', label: 'Rules Detected', format: 'number' },
  ],
};

export const profanityTextDetectedOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    { key: 'text', label: 'Censored Text' },
    { key: 'totalBadWords', label: 'Bad Words Found', format: 'number' },
    { key: 'riskScore', label: 'Risk Score', format: 'number' },
    { key: 'isSafe', label: 'Is Safe', format: 'boolean' },
  ],
};

export const spamEmailDetectedOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'score', label: 'Score', format: 'number' },
    { key: 'reason', label: 'Reason' },
    { key: 'isValid', label: 'Is Valid', format: 'boolean' },
  ],
};

export const spamPhoneDetectedOutputSchema: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    { key: 'phone', label: 'Phone' },
    { key: 'countryCode', label: 'Country Code' },
    { key: 'carrier', label: 'Carrier' },
    { key: 'reason', label: 'Reason' },
    { key: 'isValid', label: 'Is Valid', format: 'boolean' },
  ],
};
