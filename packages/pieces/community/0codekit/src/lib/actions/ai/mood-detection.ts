import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitAi } from '../../common/ai';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const moodDetectionAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'mood_detection',
    classification: 'READ',
    displayName: 'Mood Detection',
    description: 'Analyze whether a text sounds positive, neutral or negative.',
    audience: 'both',
    aiMetadata: {
        description:
            'Run sentiment analysis on a text. Returns the overall mood (typically `positive`, `neutral`, `negative` or `mixed`), a score between 0 and 1 for each of positive, neutral and negative, and the mood of every sentence. Nothing is stored; safe to retry.',
        idempotent: true,
    },
    props: {
        text: zeroCodeKitAi.textProp({ description: 'The text to analyze, such as a review, email or message.' }),
    },
    outputSchema: businessAiOutputSchemas.moodDetection,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<MoodDetectionResponse>({
            apiKey: auth.secret_text,
            path: '/ai/mooddetection',
            body: { text: zeroCodeKitAi.requireText({ value: propsValue.text, label: 'Text' }) },
        });
        return {
            mood: response.moodOverall ?? null,
            positive_score: response.moodScore?.positive ?? null,
            neutral_score: response.moodScore?.neutral ?? null,
            negative_score: response.moodScore?.negative ?? null,
            sentences: (response.moodPerSentence ?? []).map((sentence) => ({
                text: sentence.text ?? null,
                mood: sentence.mood ?? null,
            })),
        };
    },
});

type MoodDetectionResponse = {
    moodOverall?: string;
    moodScore?: {
        positive?: number;
        neutral?: number;
        negative?: number;
    };
    moodPerSentence?: {
        mood?: string;
        text?: string;
    }[];
};
