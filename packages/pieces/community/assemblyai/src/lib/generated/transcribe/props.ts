import { Property } from '@activepieces/pieces-framework';
export const props = {
  audio_url: Property.ShortText({
    displayName: 'Audio URL',
    required: true,
    description: 'Public link to the audio or video file.',
    placeholder: 'https://example.com/call.mp3',
  }),
  language_code: Property.StaticDropdown({
    displayName: 'Language',
    required: false,
    description: 'Spoken language. Empty: US English, unless detection is on.',
    options: {
      options: [
        {
          label: 'English (Global)',
          value: 'en',
        },
        {
          label: 'English (Australian)',
          value: 'en_au',
        },
        {
          label: 'English (British)',
          value: 'en_uk',
        },
        {
          label: 'English (US)',
          value: 'en_us',
        },
        {
          label: 'Spanish',
          value: 'es',
        },
        {
          label: 'French',
          value: 'fr',
        },
        {
          label: 'German',
          value: 'de',
        },
        {
          label: 'Italian',
          value: 'it',
        },
        {
          label: 'Portuguese',
          value: 'pt',
        },
        {
          label: 'Dutch',
          value: 'nl',
        },
        {
          label: 'Afrikaans',
          value: 'af',
        },
        {
          label: 'Albanian',
          value: 'sq',
        },
        {
          label: 'Amharic',
          value: 'am',
        },
        {
          label: 'Arabic',
          value: 'ar',
        },
        {
          label: 'Armenian',
          value: 'hy',
        },
        {
          label: 'Assamese',
          value: 'as',
        },
        {
          label: 'Azerbaijani',
          value: 'az',
        },
        {
          label: 'Bashkir',
          value: 'ba',
        },
        {
          label: 'Basque',
          value: 'eu',
        },
        {
          label: 'Belarusian',
          value: 'be',
        },
        {
          label: 'Bengali',
          value: 'bn',
        },
        {
          label: 'Bosnian',
          value: 'bs',
        },
        {
          label: 'Breton',
          value: 'br',
        },
        {
          label: 'Bulgarian',
          value: 'bg',
        },
        {
          label: 'Burmese',
          value: 'my',
        },
        {
          label: 'Catalan',
          value: 'ca',
        },
        {
          label: 'Chinese',
          value: 'zh',
        },
        {
          label: 'Croatian',
          value: 'hr',
        },
        {
          label: 'Czech',
          value: 'cs',
        },
        {
          label: 'Danish',
          value: 'da',
        },
        {
          label: 'Estonian',
          value: 'et',
        },
        {
          label: 'Faroese',
          value: 'fo',
        },
        {
          label: 'Finnish',
          value: 'fi',
        },
        {
          label: 'Galician',
          value: 'gl',
        },
        {
          label: 'Georgian',
          value: 'ka',
        },
        {
          label: 'Greek',
          value: 'el',
        },
        {
          label: 'Gujarati',
          value: 'gu',
        },
        {
          label: 'Haitian',
          value: 'ht',
        },
        {
          label: 'Hausa',
          value: 'ha',
        },
        {
          label: 'Hawaiian',
          value: 'haw',
        },
        {
          label: 'Hebrew',
          value: 'he',
        },
        {
          label: 'Hindi',
          value: 'hi',
        },
        {
          label: 'Hungarian',
          value: 'hu',
        },
        {
          label: 'Icelandic',
          value: 'is',
        },
        {
          label: 'Indonesian',
          value: 'id',
        },
        {
          label: 'Japanese',
          value: 'ja',
        },
        {
          label: 'Javanese',
          value: 'jw',
        },
        {
          label: 'Kannada',
          value: 'kn',
        },
        {
          label: 'Kazakh',
          value: 'kk',
        },
        {
          label: 'Khmer',
          value: 'km',
        },
        {
          label: 'Korean',
          value: 'ko',
        },
        {
          label: 'Lao',
          value: 'lo',
        },
        {
          label: 'Latin',
          value: 'la',
        },
        {
          label: 'Latvian',
          value: 'lv',
        },
        {
          label: 'Lingala',
          value: 'ln',
        },
        {
          label: 'Lithuanian',
          value: 'lt',
        },
        {
          label: 'Luxembourgish',
          value: 'lb',
        },
        {
          label: 'Macedonian',
          value: 'mk',
        },
        {
          label: 'Malagasy',
          value: 'mg',
        },
        {
          label: 'Malay',
          value: 'ms',
        },
        {
          label: 'Malayalam',
          value: 'ml',
        },
        {
          label: 'Maltese',
          value: 'mt',
        },
        {
          label: 'Maori',
          value: 'mi',
        },
        {
          label: 'Marathi',
          value: 'mr',
        },
        {
          label: 'Mongolian',
          value: 'mn',
        },
        {
          label: 'Nepali',
          value: 'ne',
        },
        {
          label: 'Norwegian',
          value: 'no',
        },
        {
          label: 'Norwegian Nynorsk',
          value: 'nn',
        },
        {
          label: 'Occitan',
          value: 'oc',
        },
        {
          label: 'Panjabi',
          value: 'pa',
        },
        {
          label: 'Pashto',
          value: 'ps',
        },
        {
          label: 'Persian',
          value: 'fa',
        },
        {
          label: 'Polish',
          value: 'pl',
        },
        {
          label: 'Romanian',
          value: 'ro',
        },
        {
          label: 'Russian',
          value: 'ru',
        },
        {
          label: 'Sanskrit',
          value: 'sa',
        },
        {
          label: 'Serbian',
          value: 'sr',
        },
        {
          label: 'Shona',
          value: 'sn',
        },
        {
          label: 'Sindhi',
          value: 'sd',
        },
        {
          label: 'Sinhala',
          value: 'si',
        },
        {
          label: 'Slovak',
          value: 'sk',
        },
        {
          label: 'Slovenian',
          value: 'sl',
        },
        {
          label: 'Somali',
          value: 'so',
        },
        {
          label: 'Sundanese',
          value: 'su',
        },
        {
          label: 'Swahili',
          value: 'sw',
        },
        {
          label: 'Swedish',
          value: 'sv',
        },
        {
          label: 'Tagalog',
          value: 'tl',
        },
        {
          label: 'Tajik',
          value: 'tg',
        },
        {
          label: 'Tamil',
          value: 'ta',
        },
        {
          label: 'Tatar',
          value: 'tt',
        },
        {
          label: 'Telugu',
          value: 'te',
        },
        {
          label: 'Thai',
          value: 'th',
        },
        {
          label: 'Tibetan',
          value: 'bo',
        },
        {
          label: 'Turkish',
          value: 'tr',
        },
        {
          label: 'Turkmen',
          value: 'tk',
        },
        {
          label: 'Ukrainian',
          value: 'uk',
        },
        {
          label: 'Urdu',
          value: 'ur',
        },
        {
          label: 'Uzbek',
          value: 'uz',
        },
        {
          label: 'Vietnamese',
          value: 'vi',
        },
        {
          label: 'Welsh',
          value: 'cy',
        },
        {
          label: 'Yiddish',
          value: 'yi',
        },
        {
          label: 'Yoruba',
          value: 'yo',
        },
      ],
    },
  }),
  language_detection: Property.Checkbox({
    displayName: 'Detect Language',
    required: false,
    description: 'Let AssemblyAI work out the spoken language.',
    reveals: ['language_confidence_threshold'],
    defaultValue: false,
  }),
  language_confidence_threshold: Property.Number({
    displayName: 'Minimum Confidence',
    required: false,
    description: 'Fail if detection is less sure than this, from 0 to 1.',
  }),
  speech_model: Property.StaticDropdown({
    displayName: 'Speech Model',
    required: false,
    description: 'Empty uses Best. Nano is faster and cheaper.',
    options: {
      options: [
        {
          label: 'Best',
          value: 'best',
        },
        {
          label: 'Nano',
          value: 'nano',
        },
      ],
    },
  }),
  punctuate: Property.Checkbox({
    displayName: 'Punctuate',
    required: false,
    description: 'Add punctuation to the text.',
    advanced: true,
    defaultValue: true,
  }),
  format_text: Property.Checkbox({
    displayName: 'Format Text',
    required: false,
    description: 'Format numbers, dates and casing.',
    advanced: true,
    defaultValue: true,
  }),
  disfluencies: Property.Checkbox({
    displayName: 'Keep Filler Words',
    required: false,
    description: 'Keep words like "umm" and "uh" in the text.',
    advanced: true,
    defaultValue: false,
  }),
  dual_channel: Property.Checkbox({
    displayName: 'Dual Channel',
    required: false,
    description: 'Transcribe each audio channel separately.',
    advanced: true,
    defaultValue: false,
  }),
  webhook_url: Property.ShortText({
    displayName: 'Webhook URL',
    required: false,
    description: 'AssemblyAI calls this URL when the transcript is done.',
    advanced: true,
    placeholder: 'https://example.com/webhook',
  }),
  webhook_auth_header_name: Property.ShortText({
    displayName: 'Webhook Header Name',
    required: false,
    description: 'Header sent with each webhook call.',
    advanced: true,
    placeholder: 'X-Webhook-Secret',
  }),
  webhook_auth_header_value: Property.ShortText({
    displayName: 'Webhook Header Value',
    required: false,
    description: 'Value of the webhook header.',
    advanced: true,
  }),
  auto_highlights: Property.Checkbox({
    displayName: 'Key Phrases',
    required: false,
    description: 'Pick out the most important words and phrases.',
    defaultValue: false,
  }),
  audio_start_from: Property.Number({
    displayName: 'Start At',
    required: false,
    description: 'Milliseconds into the file to start transcribing.',
    width: 'half',
  }),
  audio_end_at: Property.Number({
    displayName: 'End At',
    required: false,
    description: 'Milliseconds into the file to stop transcribing.',
    width: 'half',
  }),
  word_boost: Property.Array({
    displayName: 'Words to Boost',
    required: false,
    description: 'Uncommon words or names to recognize more often.',
  }),
  boost_param: Property.StaticDropdown({
    displayName: 'Boost Level',
    required: false,
    description: 'How strongly to favor the words to boost.',
    options: {
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Default',
          value: 'default',
        },
        {
          label: 'High',
          value: 'high',
        },
      ],
    },
  }),
  filter_profanity: Property.Checkbox({
    displayName: 'Filter Profanity',
    required: false,
    description: 'Replace swear words with asterisks.',
    advanced: true,
    defaultValue: false,
  }),
  redact_pii: Property.Checkbox({
    displayName: 'Redact Personal Data',
    required: false,
    description: 'Remove personal data from the transcript text.',
    reveals: ['redact_pii_policies', 'redact_pii_sub', 'redact_pii_audio', 'redact_pii_audio_quality'],
    defaultValue: false,
  }),
  redact_pii_audio: Property.Checkbox({
    displayName: 'Redact Audio Too',
    required: false,
    description: 'Also make a copy of the audio with personal data bleeped.',
    defaultValue: false,
  }),
  redact_pii_audio_quality: Property.StaticDropdown({
    displayName: 'Redacted Audio Format',
    required: false,
    description: 'File format of the bleeped audio.',
    options: {
      options: [
        {
          label: 'MP3',
          value: 'mp3',
        },
        {
          label: 'WAV',
          value: 'wav',
        },
      ],
    },
  }),
  redact_pii_policies: Property.StaticMultiSelectDropdown({
    displayName: 'Data to Redact',
    required: false,
    description: 'Kinds of personal data to remove.',
    options: {
      options: [
        {
          label: 'Account Number',
          value: 'account_number',
        },
        {
          label: 'Banking Information',
          value: 'banking_information',
        },
        {
          label: 'Blood Type',
          value: 'blood_type',
        },
        {
          label: 'Credit Card CVV',
          value: 'credit_card_cvv',
        },
        {
          label: 'Credit Card Expiration',
          value: 'credit_card_expiration',
        },
        {
          label: 'Credit Card Number',
          value: 'credit_card_number',
        },
        {
          label: 'Date',
          value: 'date',
        },
        {
          label: 'Date Interval',
          value: 'date_interval',
        },
        {
          label: 'Date of Birth',
          value: 'date_of_birth',
        },
        {
          label: "Driver's License",
          value: 'drivers_license',
        },
        {
          label: 'Drug',
          value: 'drug',
        },
        {
          label: 'Duration',
          value: 'duration',
        },
        {
          label: 'Email Address',
          value: 'email_address',
        },
        {
          label: 'Event',
          value: 'event',
        },
        {
          label: 'Filename',
          value: 'filename',
        },
        {
          label: 'Gender and Sexuality',
          value: 'gender_sexuality',
        },
        {
          label: 'Healthcare Number',
          value: 'healthcare_number',
        },
        {
          label: 'Injury',
          value: 'injury',
        },
        {
          label: 'IP Address',
          value: 'ip_address',
        },
        {
          label: 'Language',
          value: 'language',
        },
        {
          label: 'Location',
          value: 'location',
        },
        {
          label: 'Marital Status',
          value: 'marital_status',
        },
        {
          label: 'Medical Condition',
          value: 'medical_condition',
        },
        {
          label: 'Medical Process',
          value: 'medical_process',
        },
        {
          label: 'Money Amount',
          value: 'money_amount',
        },
        {
          label: 'Nationality',
          value: 'nationality',
        },
        {
          label: 'Number Sequence',
          value: 'number_sequence',
        },
        {
          label: 'Occupation',
          value: 'occupation',
        },
        {
          label: 'Organization',
          value: 'organization',
        },
        {
          label: 'Passport Number',
          value: 'passport_number',
        },
        {
          label: 'Password',
          value: 'password',
        },
        {
          label: 'Person Age',
          value: 'person_age',
        },
        {
          label: 'Person Name',
          value: 'person_name',
        },
        {
          label: 'Phone Number',
          value: 'phone_number',
        },
        {
          label: 'Physical Attribute',
          value: 'physical_attribute',
        },
        {
          label: 'Political Affiliation',
          value: 'political_affiliation',
        },
        {
          label: 'Religion',
          value: 'religion',
        },
        {
          label: 'Statistics',
          value: 'statistics',
        },
        {
          label: 'Time',
          value: 'time',
        },
        {
          label: 'URL',
          value: 'url',
        },
        {
          label: 'US Social Security Number',
          value: 'us_social_security_number',
        },
        {
          label: 'Username',
          value: 'username',
        },
        {
          label: 'Vehicle ID',
          value: 'vehicle_id',
        },
        {
          label: 'Zodiac Sign',
          value: 'zodiac_sign',
        },
      ],
    },
  }),
  redact_pii_sub: Property.StaticDropdown({
    displayName: 'Replace With',
    required: false,
    description: 'Show removed data as its type, such as [PERSON_NAME], or as ####.',
    options: {
      options: [
        {
          label: 'Entity Name',
          value: 'entity_name',
        },
        {
          label: 'Hash',
          value: 'hash',
        },
      ],
    },
  }),
  speaker_labels: Property.Checkbox({
    displayName: 'Identify Speakers',
    required: false,
    description: 'Label who is speaking in each part of the text.',
    reveals: ['speakers_expected'],
    defaultValue: false,
  }),
  speakers_expected: Property.Number({
    displayName: 'Number of Speakers',
    required: false,
    description: 'How many speakers to expect, up to 10.',
    display: 'stepper',
    min: 1,
    max: 10,
    step: 1,
  }),
  content_safety: Property.Checkbox({
    displayName: 'Content Moderation',
    required: false,
    description: 'Flag sensitive content such as violence or hate speech.',
    reveals: ['content_safety_confidence'],
    defaultValue: false,
  }),
  content_safety_confidence: Property.Number({
    displayName: 'Minimum Confidence',
    required: false,
    description: 'Only flag content found with at least this confidence, 25 to 100.',
    display: 'stepper',
    min: 25,
    max: 100,
    step: 5,
  }),
  iab_categories: Property.Checkbox({
    displayName: 'Topic Detection',
    required: false,
    description: 'Tag the transcript with standard topic categories.',
    defaultValue: false,
  }),
  custom_spelling: Property.Json({
    displayName: 'Custom Spellings',
    required: false,
    description: 'Rules to change spellings, as a JSON list of from and to pairs.',
  }),
  sentiment_analysis: Property.Checkbox({
    displayName: 'Sentiment Analysis',
    required: false,
    description: 'Rate each sentence as positive, neutral or negative.',
    defaultValue: false,
  }),
  auto_chapters: Property.Checkbox({
    displayName: 'Auto Chapters',
    required: false,
    description: 'Split the transcript into chapters with summaries.',
    defaultValue: false,
  }),
  entity_detection: Property.Checkbox({
    displayName: 'Entity Detection',
    required: false,
    description: 'Find names, places, companies and other entities.',
    defaultValue: false,
  }),
  speech_threshold: Property.Number({
    displayName: 'Minimum Speech',
    required: false,
    description: 'Reject files with less speech than this share, from 0 to 1.',
    advanced: true,
  }),
  summarization: Property.Checkbox({
    displayName: 'Summarize',
    required: false,
    description: 'Add a summary of the transcript.',
    reveals: ['summary_model', 'summary_type'],
    defaultValue: false,
  }),
  summary_model: Property.StaticDropdown({
    displayName: 'Summary Style',
    required: false,
    description: 'Empty uses Informative.',
    options: {
      options: [
        {
          label: 'Informative',
          value: 'informative',
        },
        {
          label: 'Conversational',
          value: 'conversational',
        },
        {
          label: 'Catchy',
          value: 'catchy',
        },
      ],
    },
  }),
  summary_type: Property.StaticDropdown({
    displayName: 'Summary Format',
    required: false,
    description: 'Empty uses Bullets.',
    options: {
      options: [
        {
          label: 'Bullets',
          value: 'bullets',
        },
        {
          label: 'Bullets Verbose',
          value: 'bullets_verbose',
        },
        {
          label: 'Gist',
          value: 'gist',
        },
        {
          label: 'Headline',
          value: 'headline',
        },
        {
          label: 'Paragraph',
          value: 'paragraph',
        },
      ],
    },
  }),
  custom_topics: Property.Checkbox({
    displayName: 'Custom Topics',
    required: false,
    description: 'Tag the transcript with your own topics.',
    reveals: ['topics'],
    defaultValue: false,
  }),
  topics: Property.Array({
    displayName: 'Topics',
    required: false,
    description: 'Topics to look for.',
  }),
};
