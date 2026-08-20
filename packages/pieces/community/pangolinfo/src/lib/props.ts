import { Property } from '@activepieces/pieces-framework';

const amazonSite = Property.StaticDropdown({
  displayName: 'Amazon Marketplace',
  description: 'Marketplace used for localized Amazon data.',
  required: true,
  defaultValue: 'amz_us',
  options: {
    options: [
      { label: 'United States', value: 'amz_us' },
      { label: 'United Kingdom', value: 'amz_uk' },
      { label: 'Germany', value: 'amz_de' },
      { label: 'Canada', value: 'amz_ca' },
      { label: 'Japan', value: 'amz_jp' },
      { label: 'France', value: 'amz_fr' },
      { label: 'Italy', value: 'amz_it' },
      { label: 'Spain', value: 'amz_es' },
    ],
  },
});

const zipcode = Property.ShortText({
  displayName: 'ZIP or Postal Code',
  description: 'Location used for localized availability, delivery, and pricing.',
  required: false,
  defaultValue: '10041',
});

const pangolinfoProps = { amazonSite, zipcode };

export { pangolinfoProps };
