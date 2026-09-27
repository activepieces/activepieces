import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const textContainsAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'text_contains',
    classification: 'READ',
    displayName: 'Text Contains',
    description: 'Check whether a text contains one or more keywords, and where.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search a text for one or more keywords and report, per keyword, whether it was found and at which character positions, plus whether any or all keywords matched. Optionally case-sensitive or whole-word only. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text to search in.',
            required: true,
        }),
        keywords: Property.Array({
            displayName: 'Keywords',
            description: 'The words or phrases to look for.',
            required: true,
        }),
        caseSensitive: Property.Checkbox({
            displayName: 'Case Sensitive',
            description: 'Turn on to treat "Apple" and "apple" as different words.',
            required: false,
            defaultValue: false,
        }),
        onlyCompleteWords: Property.Checkbox({
            displayName: 'Whole Words Only',
            description: 'Turn on so that "cat" does not match inside "category".',
            required: false,
            defaultValue: false,
        }),
    },
    outputSchema: businessAiOutputSchemas.textContains,
    async run({ auth, propsValue }) {
        const keywords = normalizeKeywords(propsValue.keywords);
        if (keywords.length === 0) {
            throw new Error('Add at least one keyword to search for.');
        }
        const response = await zeroCodeKitApi.post<TextContainsResponse>({
            apiKey: auth.secret_text,
            path: '/text/contains',
            body: {
                text: propsValue.text,
                keywordList: keywords,
                options: {
                    caseSensitive: propsValue.caseSensitive ?? false,
                    onlyCompleteWords: propsValue.onlyCompleteWords ?? false,
                },
            },
        });
        const findings = (response.findings ?? []).map((finding) => ({
            keyword: finding.keyword ?? null,
            contains: finding.contains ?? false,
            match_count: finding.foundPositions?.length ?? 0,
            found_positions: (finding.foundPositions ?? []).join(', '),
        }));
        return {
            contains_any: findings.some((finding) => finding.contains),
            contains_all: findings.length > 0 && findings.every((finding) => finding.contains),
            findings,
        };
    },
});

function normalizeKeywords(keywords: unknown[]): string[] {
    return keywords
        .flat()
        .filter((keyword): keyword is string | number => typeof keyword === 'string' || typeof keyword === 'number')
        .map((keyword) => String(keyword).trim())
        .filter((keyword) => keyword.length > 0);
}

type TextContainsResponse = {
    findings?: {
        keyword?: string;
        contains?: boolean;
        foundPositions?: number[];
    }[];
};
