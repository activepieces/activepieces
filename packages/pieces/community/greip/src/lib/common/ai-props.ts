import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function userId<R extends boolean>({
  required,
  displayName = 'User ID',
  description = 'Your own identifier for the end user this request is about (email, phone or user id). Greip groups requests by it on its Events page.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function language<R extends boolean>({
  required,
  displayName = 'Language',
  description = 'Language for place names in the response. Defaults to English.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'English', value: 'EN' },
        { label: 'Arabic', value: 'AR' },
        { label: 'French', value: 'FR' },
        { label: 'German', value: 'DE' },
        { label: 'Spanish', value: 'ES' },
        { label: 'Japanese', value: 'JA' },
        { label: 'Chinese', value: 'ZH' },
        { label: 'Russian', value: 'RU' },
      ],
    },
  });
}

function ipModules<R extends boolean>({
  required,
  displayName = 'Extra Modules',
  description = 'Optional data to add to the response. IP and geo data are always included.',
}: PropParams<R>) {
  return Property.StaticMultiSelectDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Security (VPN, proxy, Tor, bot, hosting)', value: 'security' },
        { label: 'Currency', value: 'currency' },
        { label: 'Timezone', value: 'timezone' },
        { label: 'Location (language, flag, phone code)', value: 'location' },
        { label: 'Device', value: 'device' },
      ],
    },
  });
}

export const greipAiProps = { userId, language, ipModules };
