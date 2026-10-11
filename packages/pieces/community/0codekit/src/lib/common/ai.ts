import { Property } from '@activepieces/pieces-framework';

export const zeroCodeKitAi = {
    textProp,
    imageUrlProp,
    targetLanguageProp,
    requireText,
    stringList,
};

function textProp({ description }: { description: string }) {
    return Property.LongText({
        displayName: 'Text',
        description,
        required: true,
    });
}

function imageUrlProp({ description }: { description: string }) {
    return Property.ShortText({
        displayName: 'Image URL',
        description,
        required: true,
        placeholder: 'https://example.com/image.jpg',
    });
}

function targetLanguageProp() {
    return Property.StaticDropdown({
        displayName: 'Target Language',
        description: 'The language to translate the text into.',
        required: true,
        options: {
            options: TARGET_LANGUAGES.map((language) => ({
                label: `${language.name} (${language.code})`,
                value: language.code,
            })),
        },
    });
}

function requireText({ value, label }: { value: string | undefined; label: string }): string {
    const trimmed = (value ?? '').trim();
    if (trimmed === '') {
        throw new Error(`${label} cannot be empty.`);
    }
    return trimmed;
}

function stringList(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

const TARGET_LANGUAGES = [
    { code: 'ar', name: 'Arabic' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'vi', name: 'Vietnamese' },
];
