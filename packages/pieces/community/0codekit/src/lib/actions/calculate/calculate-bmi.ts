import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const calculateBmiAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'calculate_bmi',
    classification: 'READ',
    displayName: 'Calculate BMI',
    description: 'Calculate body mass index, desirable weight and daily nutrient needs from height and weight.',
    audience: 'both',
    aiMetadata: {
        description:
            'Calculate BMI and its classification from weight in kilograms and height in centimetres, plus desirable body weight, daily calories and daily carbohydrate, protein and fat in grams. Convert pounds or inches first. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        weight: Property.Number({
            displayName: 'Weight (kg)',
            description: 'Body weight in kilograms.',
            required: true,
        }),
        height: Property.Number({
            displayName: 'Height (cm)',
            description: 'Body height in centimetres.',
            required: true,
        }),
    },
    outputSchema: dateConvertSchemas.bmi,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<BmiResponse>({
            apiKey: auth.secret_text,
            path: '/calculate/bmi',
            body: {
                weight: propsValue.weight,
                height: propsValue.height,
            },
        });
        return {
            bmi: response.bmi ?? null,
            classification: response.bmiClassification ?? null,
            desirable_body_weight_kg: response.dbw ?? null,
            daily_calories_kcal: response.kcal ?? null,
            daily_carbohydrates_g: response.nutrients?.carbohydrates ?? null,
            daily_protein_g: response.nutrients?.protein ?? null,
            daily_fat_g: response.nutrients?.fat ?? null,
        };
    },
});

type BmiResponse = {
    bmi?: number;
    bmiClassification?: string;
    dbw?: number;
    kcal?: number;
    nutrients?: {
        carbohydrates?: number;
        protein?: number;
        fat?: number;
    };
};
