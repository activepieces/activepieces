import { Property } from '@activepieces/pieces-framework';

export const engineDropdownOptions = Property.StaticDropdown({
  displayName: 'Engine',
  description: 'Select the engine quality level',
  required: true,
  defaultValue: 'economy',
  options: {
    options: [
      { label: 'Economy', value: 'economy' },
      { label: 'Average', value: 'average' },
      { label: 'Good', value: 'good' },
      { label: 'Premium', value: 'premium' },
    ],
  },
});

export const languageDropdownOptions = Property.StaticDropdown({
  displayName: 'Language',
  description: 'Select the language',
  required: true,
  defaultValue: 'en',
  options: {
    options: [
      { label: 'English', value: 'en' },
      { label: 'Dutch', value: 'nl' },
      { label: 'French', value: 'fr' },
      { label: 'German', value: 'de' },
      { label: 'Italian', value: 'it' },
      { label: 'Polish', value: 'pl' },
      { label: 'Spanish', value: 'es' },
      { label: 'Portuguese (Portugal)', value: 'pt-pt' },
      { label: 'Portuguese (Brazil)', value: 'pt-br' },
      { label: 'Russian', value: 'ru' },
      { label: 'Japanese', value: 'ja' },
      { label: 'Chinese', value: 'zh' },
      { label: 'Bulgarian', value: 'bg' },
      { label: 'Czech', value: 'cs' },
      { label: 'Danish', value: 'da' },
      { label: 'Greek', value: 'el' },
      { label: 'Hungarian', value: 'hu' },
      { label: 'Lithuanian', value: 'lt' },
      { label: 'Latvian', value: 'lv' },
      { label: 'Romanian', value: 'ro' },
      { label: 'Slovak', value: 'sk' },
      { label: 'Slovenian', value: 'sl' },
      { label: 'Swedish', value: 'sv' },
      { label: 'Finnish', value: 'fi' },
      { label: 'Estonian', value: 'et' },
    ],
  },
});

export const toneofvoiceDropdown = Property.StaticDropdown({
  displayName: 'Tone of Voice',
  description: 'Select the tone of voice for the content',
  required: false,
  defaultValue: 'excited',
  options: {
    options: [
      { label: 'Excited', value: 'excited' },
      { label: 'Professional', value: 'professional' },
      { label: 'Funny', value: 'funny' },
      { label: 'Encouraging', value: 'encouraging' },
      { label: 'Dramatic', value: 'dramatic' },
      { label: 'Witty', value: 'witty' },
      { label: 'Sarcastic', value: 'sarcastic' },
      { label: 'Engaging', value: 'engaging' },
      { label: 'Creative', value: 'creative' },
    ],
  },
});