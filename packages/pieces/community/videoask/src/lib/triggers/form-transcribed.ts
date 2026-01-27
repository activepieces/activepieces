
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { organizationIdDropdown, videoaskIdDropdown } from '../common/props';
import { videoaskAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const formTranscribed = createTrigger({
    auth: videoaskAuth,
    name: 'formTranscribed',
    displayName: 'Form transcribed',
    description: 'Triggered when a form is transcribed',
    props: {
        organizationId: organizationIdDropdown,
        formId: videoaskIdDropdown,
        tag: Property.ShortText({
            displayName: 'Tag',
            description:
                'A short, unique identifier for this webhook. Tags help you easily distinguish webhooks when you need to retrieve, update, or delete them.',
            required: true,
        }),
    },
    sampleData: {
        "event_id": "1cc057d1a8acc59ed2ed7a7cd5edbf1b",
        "event_type": "form_response_transcribed",
        "interaction_id": "386bbc0b-bb60-4b62-82fa-d630d0d2b83b",
        "contact": {
            "contact_id": "7c6550ff-fe15-424a-918e-2c1936db8aed",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone_number": null,
            "thumbnail": "https://media.videoask.com/transcoded/a8v1jwbdwwc7uq0keni9kf0c5l42vt42gp23f4ej-00001.jpg",
            "status": "completed",
            "created_at": "2020-03-30T16:04:09.021715Z",
            "updated_at": "2020-03-30T16:05:08.952236Z",
            "answers": [
                {
                    "answer_id": "0f4ab93a-4914-4e4a-a33b-8466fda6147a",
                    "created_at": "2020-03-30T16:04:09.353595Z",
                    "poll_option_content": "Grapes",
                    "poll_option_id": "3c4a9c2e-fab0-47bf-b545-ff2d77ce3b21",
                    "question_id": "4d73e927-e0ef-4b73-a5da-cdda038545e1",
                    "type": "poll"
                },
                {
                    "answer_id": "995948a9-8a02-48f8-a018-769f0f25e7f8",
                    "created_at": "2020-03-30T16:05:05.434020Z",
                    "media_url": "https://media.videoask.com/transcoded/a8v1jwbdwwc7uq0keni9kf0c5l42vt42gp23f4ej.mp4",
                    "question_id": "a74ac70a-b207-492d-a3c8-43c8508f5c7a",
                    "share_id": "a8v1jwbdwwc7uq0keni9kf0c5l42vt42gp23f4ej",
                    "share_url": "https://www.videoask.com/a8v1jwbdwwc7uq0keni9kf0c5l42vt42gp23f4ej",
                    "thumbnail": "https://media.videoask.com/transcoded/a8v1jwbdwwc7uq0keni9kf0c5l42vt42gp23f4ej-00001.jpg",
                    "transcode_status": "completed",
                    "transcription": "I don't actually know, but once I start eating them, I can never stop.",
                    "type": "video"
                }
            ]
        },
        "form": {
            "form_id": "5a1b8066-f92c-47bf-b8f2-3beb0a738122",
            "title": "Example form for documentation",
            "requires_contact_info": true,
            "requires_contact_email": true,
            "requires_contact_name": true,
            "requires_contact_phone_number": false,
            "hide_branding": false,
            "metadata": {
                "primary_color": "#522CBB",
                "secondary_color": "#4CD982",
                "locale": "en-US",
                "show_form_title": true
            },
            "share_id": "f72l3mugt",
            "share_url": "https://www.videoask.com/f72l3mugt",
            "created_at": "2020-03-30T15:53:59.331687Z",
            "updated_at": "2020-03-30T15:57:11.330236Z",
            "author_id": "8a484e48-2e8e-423d-8d91-b1d6c98b60f2",
            "questions": [
                {
                    "question_id": "4d73e927-e0ef-4b73-a5da-cdda038545e1",
                    "form_id": "5a1b8066-f92c-47bf-b8f2-3beb0a738122",
                    "metadata": {
                        "text": "What's your favorite fruit?",
                        "darken_text_background": true,
                        "fit_video": false
                    },
                    "type": "poll",
                    "share_id": "ql0eet9ga",
                    "share_url": "https://www.videoask.com/ql0eet9ga",
                    "created_at": "2020-03-30T15:53:59.697150Z",
                    "updated_at": "2020-03-30T15:57:11.319072Z",
                    "thumbnail": "https://media3.giphy.com/media/xUPGcuomRFMUcsB9nO/giphy-preview.gif?cid=c83daf2546ecd961cfc590162cdb4787bf1c482527149606&rid=giphy-preview.gif",
                    "transcode_status": "completed",
                    "media_type": "video",
                    "media_url": "https://media3.giphy.com/media/xUPGcuomRFMUcsB9nO/giphy.mp4?cid=c83daf2546ecd961cfc590162cdb4787bf1c482527149606&rid=giphy.mp4",
                    "poll_options": [
                        {
                            "id": "27b7cd85-db1e-4316-8dbe-772523feb098",
                            "content": "Bananas"
                        },
                        {
                            "id": "38ee39f0-aca3-4f3a-a74b-ec65beb139b3",
                            "content": "Strawberries"
                        },
                        {
                            "id": "b15efc9c-ae2e-4254-b653-50c8ef2b7364",
                            "content": "Apples"
                        },
                        {
                            "id": "3c4a9c2e-fab0-47bf-b545-ff2d77ce3b21",
                            "content": "Grapes"
                        },
                        {
                            "id": "6daada9f-cc7b-4ffe-9529-f16f35517770",
                            "content": "Other"
                        }
                    ]
                },
                {
                    "question_id": "a74ac70a-b207-492d-a3c8-43c8508f5c7a",
                    "form_id": "5a1b8066-f92c-47bf-b8f2-3beb0a738122",
                    "metadata": {
                        "text": "Why do you love that fruit?",
                        "darken_text_background": true,
                        "fit_video": false
                    },
                    "type": "standard",
                    "allowed_answer_media_types": [
                        "video",
                        "audio",
                        "text"
                    ],
                    "share_id": "qrv6rnyg3",
                    "share_url": "https://www.videoask.com/qrv6rnyg3",
                    "created_at": "2020-03-30T15:57:10.931514Z",
                    "updated_at": "2020-03-30T15:57:11.324552Z",
                    "thumbnail": "https://media2.giphy.com/media/9nIIo3LBIlzvW/giphy-preview.gif?cid=c83daf25eacd7951d2151b3805a0177237e0b1c9c45d0b31&rid=giphy-preview.gif",
                    "transcode_status": "completed",
                    "media_type": "video",
                    "media_url": "https://media2.giphy.com/media/9nIIo3LBIlzvW/giphy.mp4?cid=c83daf25eacd7951d2151b3805a0177237e0b1c9c45d0b31&rid=giphy.mp4"
                }
            ]
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await makeRequest(
            context.propsValue.organizationId as string,
            (context.auth as any).access_token as string,
            HttpMethod.PUT,
            `/forms/${context.propsValue.formId}/webhooks/${context.propsValue.tag}`,
            {
                url: context.webhookUrl,
                event_types: ['form_response_transcribed']
            }
        );
    },
    async onDisable(context) {
        await makeRequest(
            context.propsValue.organizationId as string,
            (context.auth as any).access_token as string,
            HttpMethod.DELETE,
            `/forms/${context.propsValue.formId}/webhooks/${context.propsValue.tag}`
        );
    },
    async run(context) {
        return [context.payload.body]
    }
})