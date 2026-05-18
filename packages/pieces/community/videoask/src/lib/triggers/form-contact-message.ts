import {
    createTrigger,
    Property,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { organizationIdDropdown, videoaskIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { videoaskAuth } from '../common/auth';
export const formContactMessage = createTrigger({
    auth: videoaskAuth,
    name: 'formContactMessage',
    displayName: 'Form contact message',
    description: 'Triggers when a contact sends a message via a form',
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
        "event_id": "35f63f63c4c31d04a938d5b279a6a4e6",
        "event_type": "form_contact_message",
        "interaction_id": "386bbc0b-bb60-4b62-82fa-d630d0d2b83b",
        "contact": {
            "contact_id": "6f0cde71-546c-499b-8cdb-c661300fb7f3",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "status": "completed",
            "created_at": "2020-08-13T09:07:25.501318Z",
            "updated_at": "2020-08-13T09:07:55.461776Z",
            "answers": [
                {
                    "answer_id": "f0f5a564-1f46-49e9-b579-731e6e3f9c4e",
                    "created_at": "2020-08-13T09:07:31.216396Z",
                    "is_public": false,
                    "poll_options": [
                        {
                            "id": "38ee39f0-aca3-4f3a-a74b-ec65beb139b3",
                            "content": "Strawberries"
                        }
                    ],
                    "question_id": "4d73e927-e0ef-4b73-a5da-cdda038545e1",
                    "type": "poll",
                    "poll_option_id": "38ee39f0-aca3-4f3a-a74b-ec65beb139b3",
                    "poll_option_content": "Strawberries"
                },
                {
                    "answer_id": "6254f48a-a29d-4623-9525-9a8aeab9b5dc",
                    "created_at": "2020-08-13T09:07:55.181435Z",
                    "input_text": "Bacause they're tasty!",
                    "is_public": false,
                    "poll_options": [],
                    "question_id": "a74ac70a-b207-492d-a3c8-43c8508f5c7a",
                    "type": "text"
                }
            ],
            "messages": [
                {
                    "author_type": "form_author",
                    "created_at": "2020-08-13T09:09:47.351432Z",
                    "gif": "https://media.videoask.com/transcoded/b3286b15-8722-44ad-99dd-ef643f0bb9da/thumbnails/preview.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJtZWRpYV9pZCI6ImIzMjg2YjE1LTg3MjItNDRhZC05OWRkLWVmNjQzZjBiYjlkYSIsImV4cCI6MTU5NzkxNDU4N30.sUyDJaJVDlaCTtwXIeytwRwNS9wHLSTge15owz3La2deuJLJd1xLuEEyS35F2hfPLdVsoQl6Whn9fugdCGRl9KUllPYMyJuqJwSh9bzQTsJ_VO7A3kEna13P3VOP5G3skq-XfWn3PWdmNy90HeiDikAbV4RTaxGx6OLlV6s7swqT--lQUhn8NjRYElkPBkhOKtdt_sTGXDfEcvuCB2ymvRjLxHjSB3W0o0MThiizKevEhOuwo4z6su2EECmoQ_ahGVo-f64qgSYGflflYAWtvwLntjEa1uJQ8oCbSJaffk34VHenTLj4bc-rCfbGjXK4azw_HxTm7l8em-hxpoGEm_QzNMar0NGY5hn2nZove6ekDLHUp5DpcwuAhN2nbuswRjCeI3i4f2e8EUa4w_PNHvlMk5vBTErMqNTA-28pyfz5OD1MyEQ7fH5vSnsLvRWvpYFTl-1J22krPTurN_TxPGBaEEyHSJHdK_5rqBE4kwJBwDWY-tPJrRJKKQaRF7AtvtYBhiRFlcU1eX5tWiSJvVKK5jwCLpd8nq58cx1xo5bWDspidNbAWDAh_xTQ6YFQcBX4gVDUPtse-tOBiXFjX-7O7EL3ykkWDlybRUgOw__HcemaneydY1fytJBcK_AUbB46pO0aNct11cP2-S92ie-HTwibymWuoU-YhLDEid4",
                    "is_public": true,
                    "media_duration": 9,
                    "media_type": "video",
                    "media_url": "https://media.videoask.com/transcoded/b3286b15-8722-44ad-99dd-ef643f0bb9da/video.mp4?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJtZWRpYV9pZCI6ImIzMjg2YjE1LTg3MjItNDRhZC05OWRkLWVmNjQzZjBiYjlkYSIsImV4cCI6MTU5NzkxNDU4N30.sUyDJaJVDlaCTtwXIeytwRwNS9wHLSTge15owz3La2deuJLJd1xLuEEyS35F2hfPLdVsoQl6Whn9fugdCGRl9KUllPYMyJuqJwSh9bzQTsJ_VO7A3kEna13P3VOP5G3skq-XfWn3PWdmNy90HeiDikAbV4RTaxGx6OLlV6s7swqT--lQUhn8NjRYElkPBkhOKtdt_sTGXDfEcvuCB2ymvRjLxHjSB3W0o0MThiizKevEhOuwo4z6su2EECmoQ_ahGVo-f64qgSYGflflYAWtvwLntjEa1uJQ8oCbSJaffk34VHenTLj4bc-rCfbGjXK4azw_HxTm7l8em-hxpoGEm_QzNMar0NGY5hn2nZove6ekDLHUp5DpcwuAhN2nbuswRjCeI3i4f2e8EUa4w_PNHvlMk5vBTErMqNTA-28pyfz5OD1MyEQ7fH5vSnsLvRWvpYFTl-1J22krPTurN_TxPGBaEEyHSJHdK_5rqBE4kwJBwDWY-tPJrRJKKQaRF7AtvtYBhiRFlcU1eX5tWiSJvVKK5jwCLpd8nq58cx1xo5bWDspidNbAWDAh_xTQ6YFQcBX4gVDUPtse-tOBiXFjX-7O7EL3ykkWDlybRUgOw__HcemaneydY1fytJBcK_AUbB46pO0aNct11cP2-S92ie-HTwibymWuoU-YhLDEid4",
                    "message_id": "e4d547ca-e29b-47cb-9096-8f8bbafedde2",
                    "share_id": "mctlhdikwzcxs0f618gu5mn247pexyxuqpbvodny",
                    "share_url": "https://www.videoask.com/mctlhdikwzcxs0f618gu5mn247pexyxuqpbvodny",
                    "thread_id": "95ae6155-f970-4d18-9116-191777fef28a",
                    "thumbnail": "https://media.videoask.com/transcoded/b3286b15-8722-44ad-99dd-ef643f0bb9da/thumbnails/image.0000001.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJtZWRpYV9pZCI6ImIzMjg2YjE1LTg3MjItNDRhZC05OWRkLWVmNjQzZjBiYjlkYSIsImV4cCI6MTU5NzkxNDU4N30.sUyDJaJVDlaCTtwXIeytwRwNS9wHLSTge15owz3La2deuJLJd1xLuEEyS35F2hfPLdVsoQl6Whn9fugdCGRl9KUllPYMyJuqJwSh9bzQTsJ_VO7A3kEna13P3VOP5G3skq-XfWn3PWdmNy90HeiDikAbV4RTaxGx6OLlV6s7swqT--lQUhn8NjRYElkPBkhOKtdt_sTGXDfEcvuCB2ymvRjLxHjSB3W0o0MThiizKevEhOuwo4z6su2EECmoQ_ahGVo-f64qgSYGflflYAWtvwLntjEa1uJQ8oCbSJaffk34VHenTLj4bc-rCfbGjXK4azw_HxTm7l8em-hxpoGEm_QzNMar0NGY5hn2nZove6ekDLHUp5DpcwuAhN2nbuswRjCeI3i4f2e8EUa4w_PNHvlMk5vBTErMqNTA-28pyfz5OD1MyEQ7fH5vSnsLvRWvpYFTl-1J22krPTurN_TxPGBaEEyHSJHdK_5rqBE4kwJBwDWY-tPJrRJKKQaRF7AtvtYBhiRFlcU1eX5tWiSJvVKK5jwCLpd8nq58cx1xo5bWDspidNbAWDAh_xTQ6YFQcBX4gVDUPtse-tOBiXFjX-7O7EL3ykkWDlybRUgOw__HcemaneydY1fytJBcK_AUbB46pO0aNct11cP2-S92ie-HTwibymWuoU-YhLDEid4",
                    "transcode_status": "completed",
                    "transcribe_status": "completed",
                    "transcription": "Hello, John. Thank you so much for your response. Can you please explain have it better? Why do you love strawberries? Thank you.",
                    "transcription_data": [
                        {
                            "words": [
                                {
                                    "word": "Hello,",
                                    "end_time": 1.1,
                                    "start_time": 0.8
                                },
                                {
                                    "word": "John.",
                                    "end_time": 1.5,
                                    "start_time": 1.1
                                },
                                {
                                    "word": "Thank",
                                    "end_time": 1.7,
                                    "start_time": 1.5
                                },
                                {
                                    "word": "you",
                                    "end_time": 1.8,
                                    "start_time": 1.7
                                },
                                {
                                    "word": "so",
                                    "end_time": 1.9,
                                    "start_time": 1.8
                                },
                                {
                                    "word": "much",
                                    "end_time": 2.1,
                                    "start_time": 1.9
                                },
                                {
                                    "word": "for",
                                    "end_time": 2.3,
                                    "start_time": 2.1
                                },
                                {
                                    "word": "your",
                                    "end_time": 2.4,
                                    "start_time": 2.3
                                },
                                {
                                    "word": "response.",
                                    "end_time": 3.1,
                                    "start_time": 2.4
                                },
                                {
                                    "word": "Can",
                                    "end_time": 4,
                                    "start_time": 3.9
                                },
                                {
                                    "word": "you",
                                    "end_time": 4.1,
                                    "start_time": 4
                                },
                                {
                                    "word": "please",
                                    "end_time": 4.8,
                                    "start_time": 4.1
                                },
                                {
                                    "word": "explain",
                                    "end_time": 5.3,
                                    "start_time": 4.8
                                },
                                {
                                    "word": "have",
                                    "end_time": 5.5,
                                    "start_time": 5.3
                                },
                                {
                                    "word": "it",
                                    "end_time": 5.6,
                                    "start_time": 5.5
                                },
                                {
                                    "word": "better?",
                                    "end_time": 6.1,
                                    "start_time": 5.6
                                },
                                {
                                    "word": "Why",
                                    "end_time": 6.3,
                                    "start_time": 6.1
                                },
                                {
                                    "word": "do",
                                    "end_time": 6.4,
                                    "start_time": 6.3
                                },
                                {
                                    "word": "you",
                                    "end_time": 6.5,
                                    "start_time": 6.4
                                },
                                {
                                    "word": "love",
                                    "end_time": 6.7,
                                    "start_time": 6.5
                                },
                                {
                                    "word": "strawberries?",
                                    "end_time": 7.5,
                                    "start_time": 6.7
                                },
                                {
                                    "word": "Thank",
                                    "end_time": 8.2,
                                    "start_time": 8
                                },
                                {
                                    "word": "you.",
                                    "end_time": 8.5,
                                    "start_time": 8.2
                                }
                            ],
                            "confidence": 0.90139115,
                            "transcript": "Hello, John. Thank you so much for your response. Can you please explain have it better? Why do you love strawberries? Thank you."
                        }
                    ],
                    "type": "video"
                },
                {
                    "author_type": "contact",
                    "created_at": "2020-08-13T09:32:21.909981Z",
                    "is_public": false,
                    "media_type": "text",
                    "message_id": "511bfc20-691e-471f-9f73-02e1d9888b41",
                    "share_id": "mqre28jqxifto11ejkxhvln4c3akaks8ejciqlk1",
                    "share_url": "https://www.videoask.com/mqre28jqxifto11ejkxhvln4c3akaks8ejciqlk1",
                    "thread_id": "95ae6155-f970-4d18-9116-191777fef28a",
                    "transcode_status": "completed",
                    "transcription": "Because they look good, they smell good and they taste good! \nThey're even a great source of nutrition and antioxidants.",
                    "type": "text",
                    "input_text": "Because they look good, they smell good and they taste good! \nThey're even a great source of nutrition and antioxidants."
                }
            ],
            "platform": "desktop",
            "tags": [],
            "are_answers_public": false,
            "are_messages_public": false,
            "share_id": "c3rqviz79cva7xmuoo70rva4l5fi699isbzvxjym",
            "share_url": "https://www.videoask.com/c3rqviz79cva7xmuoo70rva4l5fi699isbzvxjym"
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
            "updated_at": "2020-04-23T08:40:51.775168Z",
            "respondents_count": 13,
            "author_id": "8a484e48-2e8e-423d-8d91-b1d6c98b60f2",
            "questions": [
                {
                    "answers_count": 9,
                    "created_at": "2020-03-30T15:53:59.697150Z",
                    "form_id": "5a1b8066-f92c-47bf-b8f2-3beb0a738122",
                    "media_id": "e627bdd1-a9db-41a9-80db-a6546c9c6ba6",
                    "media_type": "video",
                    "media_url": "https://media3.giphy.com/media/xUPGcuomRFMUcsB9nO/giphy.mp4?cid=c83daf2546ecd961cfc590162cdb4787bf1c482527149606&rid=giphy.mp4",
                    "metadata": {
                        "text": "What's your favorite fruit?",
                        "darken_text_background": true,
                        "fit_video": false
                    },
                    "poll_options": [
                        {
                            "id": "27b7cd85-db1e-4316-8dbe-772523feb098",
                            "content": "Bananas",
                            "total_count": 3
                        },
                        {
                            "id": "38ee39f0-aca3-4f3a-a74b-ec65beb139b3",
                            "content": "Strawberries",
                            "total_count": 4
                        },
                        {
                            "id": "b15efc9c-ae2e-4254-b653-50c8ef2b7364",
                            "content": "Apples",
                            "total_count": 0
                        },
                        {
                            "id": "3c4a9c2e-fab0-47bf-b545-ff2d77ce3b21",
                            "content": "Grapes",
                            "total_count": 1
                        },
                        {
                            "id": "6daada9f-cc7b-4ffe-9529-f16f35517770",
                            "content": "Other",
                            "total_count": 1
                        }
                    ],
                    "allow_multiple_selection": false,
                    "question_id": "4d73e927-e0ef-4b73-a5da-cdda038545e1",
                    "share_id": "f72l3mugt",
                    "share_url": "https://www.videoask.com/f72l3mugt",
                    "thumbnail": "https://media3.giphy.com/media/xUPGcuomRFMUcsB9nO/giphy-preview.gif?cid=c83daf2546ecd961cfc590162cdb4787bf1c482527149606&rid=giphy-preview.gif",
                    "transcode_status": "completed",
                    "transcribe_status": "completed",
                    "type": "poll",
                    "updated_at": "2020-03-30T15:57:11.319072Z"
                },
                {
                    "allowed_answer_media_types": [
                        "video",
                        "audio",
                        "text"
                    ],
                    "created_at": "2020-03-30T15:57:10.931514Z",
                    "form_id": "5a1b8066-f92c-47bf-b8f2-3beb0a738122",
                    "media_id": "8031b331-c5e1-4fda-8523-314c2fa5cdd8",
                    "media_type": "video",
                    "media_url": "https://media2.giphy.com/media/9nIIo3LBIlzvW/giphy.mp4?cid=c83daf25eacd7951d2151b3805a0177237e0b1c9c45d0b31&rid=giphy.mp4",
                    "metadata": {
                        "text": "Why do you love that fruit?",
                        "darken_text_background": true,
                        "fit_video": false
                    },
                    "allow_multiple_selection": false,
                    "question_id": "a74ac70a-b207-492d-a3c8-43c8508f5c7a",
                    "share_id": "f72l3mugt",
                    "share_url": "https://www.videoask.com/f72l3mugt",
                    "thumbnail": "https://media2.giphy.com/media/9nIIo3LBIlzvW/giphy-preview.gif?cid=c83daf25eacd7951d2151b3805a0177237e0b1c9c45d0b31&rid=giphy-preview.gif",
                    "transcode_status": "completed",
                    "transcribe_status": "completed",
                    "type": "standard",
                    "updated_at": "2020-03-30T15:57:11.324552Z"
                }
            ],
            "are_answers_public": false,
            "notifications": {
                "send_contact_message_emails": true
            }
        },
        "message": {
            "author_type": "contact",
            "created_at": "2020-08-13T09:32:21.909981Z",
            "is_public": false,
            "media_type": "text",
            "message_id": "511bfc20-691e-471f-9f73-02e1d9888b41",
            "share_id": "mqre28jqxifto11ejkxhvln4c3akaks8ejciqlk1",
            "share_url": "https://www.videoask.com/mqre28jqxifto11ejkxhvln4c3akaks8ejciqlk1",
            "thread_id": "95ae6155-f970-4d18-9116-191777fef28a",
            "transcode_status": "completed",
            "transcription": "Because they look good, they smell good and they taste good! \nThey're even a great source of nutrition and antioxidants.",
            "type": "text",
            "input_text": "Because they look good, they smell good and they taste good! \nThey're even a great source of nutrition and antioxidants."
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
                event_types: ['form_contact_message'],
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
        return [context.payload.body];
    },
});
