import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";
import { slidespeakAuth } from "../common/auth";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generatePresentation = createAction({
    auth: slidespeakAuth,
    name: 'generate_presentation',
    displayName: 'Generate Presentation',
    description: 'Generates a presentation from a topic.',
    props: {
        plain_text: Property.LongText({
            displayName: 'Topic / Text',
            description: 'The topic or plain text to generate a presentation about.',
            required: true,
        }),
        length: Property.Number({
            displayName: 'Number of Slides',
            description: 'The desired number of slides. Leave blank for AI to decide.',
            required: false,
        }),
        template: Property.ShortText({
            displayName: 'Template',
            description: "The name of the template to use (e.g., 'default').",
            required: true,
            defaultValue: 'default',
        }),
        tone: Property.StaticDropdown({
            displayName: 'Tone',
            description: 'The tone to use for the text.',
            required: false,
            options: {
                options: [
                    { label: 'Default', value: 'default' },
                    { label: 'Casual', value: 'casual' },
                    { label: 'Professional', value: 'professional' },
                    { label: 'Funny', value: 'funny' },
                    { label: 'Educational', value: 'educational' },
                    { label: 'Sales Pitch', value: 'sales_pitch' },
                ]
            }
        }),
        verbosity: Property.StaticDropdown({
            displayName: 'Verbosity',
            description: 'How verbose, or long, the text on each slide should be.',
            required: false,
            options: {
                options: [
                    { label: 'Standard', value: 'standard' },
                    { label: 'Concise', value: 'concise' },
                    { label: 'Text-Heavy', value: 'text-heavy' },
                ]
            }
        }),
        language: Property.ShortText({
            displayName: 'Language',
            description: "The language to use in the presentation (e.g., 'French'). Leave blank for the original language of the text.",
            required: false,
        }),
        response_format: Property.StaticDropdown({
            displayName: 'Output Format',
            description: 'The file format of the generated presentation.',
            required: false,
            options: {
                options: [
                    { label: 'PowerPoint (.pptx)', value: 'powerpoint' },
                    { label: 'PDF (.pdf)', value: 'pdf' },
                ]
            }
        }),
        custom_user_instructions: Property.LongText({
            displayName: 'Custom Instructions',
            description: 'A custom instruction that should be followed when generating the presentation.',
            required: false,
        }),
    },

    async run(context) {
        const { auth, propsValue } = context;


        const startResponse = await makeRequest<{ task_id: string }>(
            auth,
            HttpMethod.POST,
            '/presentation/generate',
            {
                plain_text: propsValue.plain_text,
                length: propsValue.length,
                template: propsValue.template,
                tone: propsValue.tone,
                verbosity: propsValue.verbosity,
                language: propsValue.language,
                response_format: propsValue.response_format,
                custom_user_instructions: propsValue.custom_user_instructions
            }
        );

        const taskId = startResponse.task_id;


        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            const statusResponse = await makeRequest<{
                task_status: string;
                task_result: { url: string } | null;
                task_info: string | object | null;
            }>(
                auth,
                HttpMethod.GET,
                `/task_status/${taskId}`,
                undefined
            );

            if (statusResponse.task_status === 'SUCCESS') {
                return statusResponse.task_result;
            }

            if (statusResponse.task_status === 'FAILURE') {
                throw new Error(`Presentation generation failed: ${JSON.stringify(statusResponse.task_info)}`);
            }

            await sleep(5000); 
            attempts++;
        }

        throw new Error("Presentation generation timed out after 5 minutes.");
    },
});