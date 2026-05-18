import { Property } from '@activepieces/pieces-framework';
export const props = {
  audio_url: Property.ShortText({
    displayName: 'Audio URL',
    required: true,
    description: 'The URL of the audio or video file to transcribe.',
  }),
  language_code: Property.StaticDropdown({
    displayName: 'Language Code',
    required: false,
    description: `The language of your audio file. Possible values are found in [Supported Languages](https://www.assemblyai.com/docs/concepts/supported-languages).\nThe default value is 'en_us'.\n`,
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
    displayName: 'Language Detection',
    required: false,
    description: `Enable [Automatic language detection](https://www.assemblyai.com/docs/models/speech-recognition#automatic-language-detection), either true or false.`,
    defaultValue: false,
  }),
  language_confidence_threshold: Property.Number({
    displayName: 'Language Confidence Threshold',
    required: false,
    description:
      'The confidence threshold for the automatically detected language.\nAn error will be returned if the language confidence is below this threshold.\nDefaults to 0.\n',
  }),
  speech_model: Property.StaticDropdown({
    displayName: 'Speech Model',
    required: false,
    description:
      'The speech model to use for the transcription. When `null`, the "best" model is used.',
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
    description: 'Enable Automatic Punctuation, can be true or false',
    defaultValue: true,
  }),
  format_text: Property.Checkbox({
    displayName: 'Format Text',
    required: false,
    description: 'Enable Text Formatting, can be true or false',
    defaultValue: true,
  }),
  disfluencies: Property.Checkbox({
    displayName: 'Disfluencies',
    required: false,
    description:
      'Transcribe Filler Words, like "umm", in your media file; can be true or false',
    defaultValue: false,
  }),
  dual_channel: Property.Checkbox({
    displayName: 'Dual Channel',
    required: false,
    description: `Enable [Dual Channel](https://www.assemblyai.com/docs/models/speech-recognition#dual-channel-transcription) transcription, can be true or false.`,
    defaultValue: false,
  }),
  webhook_url: Property.ShortText({
    displayName: 'Webhook URL',
    required: false,
    description:
      'The URL to which we send webhook requests.\nWe sends two different types of webhook requests.\nOne request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.\n',
  }),
  webhook_auth_header_name: Property.ShortText({
    displayName: 'Webhook Auth Header Name',
    required: false,
    description:
      'The header name to be sent with the transcript completed or failed webhook requests',
  }),
  webhook_auth_header_value: Property.ShortText({
    displayName: 'Webhook Auth Header Value',
    required: false,
    description:
      'The header value to send back with the transcript completed or failed webhook requests for added security',
  }),
  auto_highlights: Property.Checkbox({
    displayName: 'Key Phrases',
    required: false,
    description: 'Enable Key Phrases, either true or false',
    defaultValue: false,
  }),
  audio_start_from: Property.Number({
    displayName: 'Audio Start From',
    required: false,
    description:
      'The point in time, in milliseconds, to begin transcribing in your media file',
  }),
  audio_end_at: Property.Number({
    displayName: 'Audio End At',
    required: false,
    description:
      'The point in time, in milliseconds, to stop transcribing in your media file',
  }),
  word_boost: Property.Array({
    displayName: 'Word Boost',
    required: false,
    description:
      'The list of custom vocabulary to boost transcription probability for',
  }),
  boost_param: Property.StaticDropdown({
    displayName: 'Word Boost Level',
    required: false,
    description: 'How much to boost specified words',
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
    description:
      'Filter profanity from the transcribed text, can be true or false',
    defaultValue: false,
  }),
  redact_pii: Property.Checkbox({
    displayName: 'Redact PII',
    required: false,
    description:
      'Redact PII from the transcribed text using the Redact PII model, can be true or false',
    defaultValue: false,
  }),
  redact_pii_audio: Property.Checkbox({
    displayName: 'Redact PII Audio',
    required: false,
    description: `Generate a copy of the original media file with spoken PII "beeped" out, can be true or false. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.`,
    defaultValue: false,
  }),
  redact_pii_audio_quality: Property.StaticDropdown({
    displayName: 'Redact PII Audio Quality',
    required: false,
    description: `Controls the filetype of the audio created by redact_pii_audio. Currently supports mp3 (default) and wav. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.`,
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
    displayName: 'Redact PII Policies',
    required: false,
    description: `The list of PII Redaction policies to enable. See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.`,
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
          label: 'Gender Sexuality',
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
    displayName: 'Redact PII Substitution',
    required: false,
    description: `The replacement logic for detected PII, can be "entity_type" or "hash". See [PII redaction](https://www.assemblyai.com/docs/models/pii-redaction) for more details.`,
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
    displayName: 'Speaker Labels',
    required: false,
    description: `Enable [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization), can be true or false`,
    defaultValue: false,
  }),
  speakers_expected: Property.Number({
    displayName: 'Speakers Expected',
    required: false,
    description: `Tells the speaker label model how many speakers it should attempt to identify, up to 10. See [Speaker diarization](https://www.assemblyai.com/docs/models/speaker-diarization) for more details.`,
  }),
  content_safety: Property.Checkbox({
    displayName: 'Content Moderation',
    required: false,
    description: `Enable [Content Moderation](https://www.assemblyai.com/docs/models/content-moderation), can be true or false`,
    defaultValue: false,
  }),
  content_safety_confidence: Property.Number({
    displayName: 'Content Moderation Confidence',
    required: false,
    description:
      'The confidence threshold for the Content Moderation model. Values must be between 25 and 100.',
  }),
  iab_categories: Property.Checkbox({
    displayName: 'Topic Detection',
    required: false,
    description: `Enable [Topic Detection](https://www.assemblyai.com/docs/models/topic-detection), can be true or false`,
    defaultValue: false,
  }),
  custom_spelling: Property.Json({
    displayName: 'Custom Spellings',
    required: false,
    description:
      'Customize how words are spelled and formatted using to and from values.\nUse a JSON array of objects of the following format:\n```\n[\n  {\n    "from": ["original", "spelling"],\n    "to": "corrected"\n  }\n]\n```\n',
  }),
  sentiment_analysis: Property.Checkbox({
    displayName: 'Sentiment Analysis',
    required: false,
    description: `Enable [Sentiment Analysis](https://www.assemblyai.com/docs/models/sentiment-analysis), can be true or false`,
    defaultValue: false,
  }),
  auto_chapters: Property.Checkbox({
    displayName: 'Auto Chapters',
    required: false,
    description: `Enable [Auto Chapters](https://www.assemblyai.com/docs/models/auto-chapters), can be true or false`,
    defaultValue: false,
  }),
  entity_detection: Property.Checkbox({
    displayName: 'Entity Detection',
    required: false,
    description: `Enable [Entity Detection](https://www.assemblyai.com/docs/models/entity-detection), can be true or false`,
    defaultValue: false,
  }),
  speech_threshold: Property.Number({
    displayName: 'Speech Threshold',
    required: false,
    description:
      'Reject audio files that contain less than this fraction of speech.\nValid values are in the range [0, 1] inclusive.\n',
  }),
  summarization: Property.Checkbox({
    displayName: 'Enable Summarization',
    required: false,
    description: `Enable [Summarization](https://www.assemblyai.com/docs/models/summarization), can be true or false`,
    defaultValue: false,
  }),
  summary_model: Property.StaticDropdown({
    displayName: 'Summary Model',
    required: false,
    description: 'The model to summarize the transcript',
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
    displayName: 'Summary Type',
    required: false,
    description: 'The type of summary',
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
    displayName: 'Enable Custom Topics',
    required: false,
    description: 'Enable custom topics, either true or false',
    defaultValue: false,
  }),
  topics: Property.Array({
    displayName: 'Custom Topics',
    required: false,
    description: 'The list of custom topics',
  }),
};
