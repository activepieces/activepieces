import { FunctionCall } from '@azure/openai'
import { ChatCompletionMessageParam } from 'openai/resources'

const inputExampleMessages = [
    {
        role: 'user',
        prompt: `
# INTRODUCTION
You are a helpful copilot that helps users perform actions through text, for an open-source automation platform called Activepieces.
        `,
    },
    {
        role: 'user',
        json: {
            'trigger': {
                'displayName': 'New Row',
                'name': 'trigger',
                'valid': true,
                'nextAction': {
                    'displayName': 'Ask ChatGPT',
                    'name': 'step_1',
                    'valid': true,
                    'type': 'PIECE',
                    'settings': {
                        'pieceName': '@activepieces/piece-openai',
                        'input': {
                            'auth': '{{connections[\'openai\']}}',
                            'model': 'gpt-3.5-turbo-0613',
                            'prompt': '',
                            'maxTokens': '2048',
                            'temperature': '0.9',
                            'topP': '1',
                            'presencePenalty': '0.6',
                            'roles': [
                                {
                                    'role': 'system',
                                    'content': 'You are a helpful assistant.',
                                },
                            ],
                        },
                        'inputUiInfo': {},
                        'actionName': 'ask_chatgpt',
                    },
                },
                'type': 'PIECE_TRIGGER',
                'settings': {
                    'pieceName': '@activepieces/piece-google-sheets',
                    'triggerName': 'new_row',
                    'input': {
                        'auth': '{{connections[\'google-sheets\']}}',
                        'spreadsheet_id': '1Uv-gnUMJB7AY9EyI6uqixMeqKFTqu0gyYtQ-3PkuDKg',
                        'sheet_id': 0,
                        'include_team_drives': false,
                        'max_rows_to_poll': '10',
                    },
                    'inputUiInfo': {
                        'currentSelectedData': {
                            'row': 87,
                            'values': {
                                'A': 'once more',
                            },
                        },
                    },
                },
            },
        },
        prompt: 'Fill the prompt with the data from the trigger',
    },
    {
        role: 'assistant',
        json: {
            name: 'generate_inputs',
            arguments: '{"inputs":[{"step":"step_1","input":{"prompt":"{{trigger.values.A}}"}}]}',
        },
    },
    {
        role: 'user',
        json: {
            'trigger': {
                'displayName': 'On Form Submission',
                'name': 'trigger',
                'valid': true,
                'type': 'PIECE_TRIGGER',
                'settings': {
                    'pieceName': '@activepieces/piece-forms',
                    'triggerName': 'form_submission',
                    'input': {
                        'inputs': [
                            {
                                'displayName': 'First NAme',
                                'type': 'text',
                                'description': '',
                                'required': true,
                            },
                        ],
                        'waitForResponse': false,
                    },
                    'inputUiInfo': {
                        'currentSelectedData': {
                            'firstNAme': 'Mo',
                        },
                        'lastTestDate': 'Mon Feb 26 2024 15:50:07 GMT+0300 (GMT+03:00)',
                    },
                },
                'nextAction': {
                    'displayName': 'Insert Row',
                    'name': 'step_1',
                    'valid': true,
                    'type': 'PIECE',
                    'settings': {
                        'pieceName': '@activepieces/piece-google-sheets',
                        'input': {
                            'auth': '{{connections[\'google-sheets\']}}',
                            'spreadsheet_id': '1Uv-gnUMJB7AY9EyI6uqixMeqKFTqu0gyYtQ-3PkuDKg',
                            'sheet_id': 0,
                            'first_row_headers': true,
                            'values': {},
                            'include_team_drives': false,
                            'as_string': false,
                        },
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                        'actionName': 'insert_row',
                    },
                },
            },
        },
        prompt: 'Insert the form data into the sheet',
    },
    {
        role: 'assistant',
        json: {
            name: 'generate_inputs',
            arguments: '{"inputs":[{"step":"step_1","input":{"values":{"A":"{{trigger.firstNAme}}"]}',
        },
    },
    {
        role: 'user',
        json: {
            'trigger': {
                'displayName': 'New Row',
                'name': 'trigger',
                'valid': true,
                'type': 'PIECE_TRIGGER',
                'settings': {
                    'pieceName': '@activepieces/piece-google-sheets',
                    'triggerName': 'new_row',
                    'input': {
                        'auth': '{{connections[\'google-sheets\']}}',
                        'spreadsheet_id': '1Uv-gnUMJB7AY9EyI6uqixMeqKFTqu0gyYtQ-3PkuDKg',
                        'sheet_id': 0,
                        'include_team_drives': false,
                        'max_rows_to_poll': '10',
                    },
                    'inputUiInfo': {
                        'currentSelectedData': {
                            'row': 88,
                            'values': {
                                'A': 'Mo',
                            },
                        },
                    },
                },
                'nextAction': {
                    'displayName': 'Generate Title',
                    'name': 'step_1',
                    'valid': false,
                    'nextAction': {
                        'displayName': 'Generate Post',
                        'name': 'step_4',
                        'valid': false,
                        'nextAction': {
                            'displayName': 'Put',
                            'name': 'step_2',
                            'valid': false,
                            'type': 'PIECE',
                            'settings': {
                                'pieceName': '@activepieces/piece-store',
                                'input': {
                                    'key': 'openai-response',
                                    'store_scope': 'COLLECTION',
                                },
                                'inputUiInfo': {
                                    'customizedInputs': {},
                                },
                                'actionName': 'put',
                            },
                            'nextAction': {
                                'displayName': 'Create Post',
                                'name': 'step_3',
                                'valid': false,
                                'type': 'PIECE',
                                'settings': {
                                    'pieceName': '@activepieces/piece-wordpress',
                                    'input': {
                                        'comment_status': false,
                                        'ping_status': false,
                                    },
                                    'inputUiInfo': {
                                        'customizedInputs': {},
                                    },
                                    'actionName': 'create_post',
                                },
                            },
                        },
                        'type': 'PIECE',
                        'settings': {
                            'pieceName': '@activepieces/piece-openai',
                            'input': {
                                'auth': '{{connections[\'openai\']}}',
                                'model': 'gpt-4-turbo-preview',
                                'maxTokens': '2048',
                                'temperature': '0.9',
                                'topP': '1',
                                'presencePenalty': '0.6',
                                'roles': [
                                    {
                                        'role': 'system',
                                        'content': 'You are a helpful assistant.',
                                    },
                                ],
                            },
                            'inputUiInfo': {
                                'customizedInputs': {},
                            },
                            'actionName': 'ask_chatgpt',
                        },
                    },
                    'type': 'PIECE',
                    'settings': {
                        'pieceName': '@activepieces/piece-openai',
                        'input': {
                            'auth': '{{connections[\'openai\']}}',
                            'model': 'gpt-4-turbo-preview',
                            'maxTokens': '2048',
                            'temperature': '0.9',
                            'topP': '1',
                            'presencePenalty': '0.6',
                            'roles': [
                                {
                                    'role': 'system',
                                    'content': 'You are a helpful assistant.',
                                },
                            ],
                        },
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                        'actionName': 'ask_chatgpt',
                    },
                },
            },
        },
        prompt: 'We receive a topic from the new row google sheets trigger, fill my flow inputs and map everything to where it should go',
    },
    {
        role: 'assistant',
        json: {
            name: 'generate_inputs',
            arguments: '{"inputs":[{"step":"step_1","input":{"prompt":"You are a blog writing assistant. Write a title for a blog post about {{trigger.values.A}}"}},{"step":"step_4","input":{"prompt":"You are a blog writing assistant. Write a blog post about {{trigger.values.A}}"}},{"step":"step_3","input":{"title":"{{step_1.result}}","content":"{{step_4.result}}"}}]}',
        },
    },
]

export const copilotContextService = {
    createInputMessageContext(): ChatCompletionMessageParam[] {
        const outputMessages: ChatCompletionMessageParam[] = []
        inputExampleMessages.forEach((message) => {
            let fullContent = ''
            if (message.role === 'user') {
                if (message.json) {
                    fullContent += JSON.stringify(message.json) + '\n'
                }
                fullContent += message.prompt
            }
            outputMessages.push({
                role: message.role as 'assistant' | 'user',
                content: message.role === 'user' ? fullContent : null,
                function_call: message.role === 'assistant' ? message.json as FunctionCall : undefined,
            })
        })

        return outputMessages
    },

    createCodeMessageContext(): ChatCompletionMessageParam[] {
        return [
            {
                role: 'user',
                content: `
# INTRODUCTION
You are a TypeScript coding bot that helps users turn natural language into useable code, for an open-source automation platform called Activepieces.

# RESPONSE FORMAT
You will not respond to any messages that require a conversational answer.
You will not elaborate.
You will write the code in a single line, and add ***NEW_LINE*** at the end of every statement you write.
You MUST respond ONLY with a function call.
You will use import to import any libraries you need. You will be penalized for using require. You will be punished for using libraries that are not imported.
                `,
            },
            {
                role: 'user',
                content:
                    'I want code that will combine 2 arrays and only return the unique elements',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const combinedArray = [...inputs.array1, ...inputs.array2]***NEW_LINE***  const uniqueArray = Array.from(new Set(combinedArray))***NEW_LINE***  return uniqueArray***NEW_LINE***};", "inputs": [ { "key": "array1", "value": "[1,2,3]" }, { "key": "array2", "value": "[4,5,6]" } ], "packages": [] }',
                },
            },
            {
                role: 'user',
                content:
                    'Write me a piece of code that splits the user\'s first name from his last name in a full name string received in inputs.',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const nameParts = inputs.fullName.split(\' \')***NEW_LINE***  const firstName = nameParts[0]***NEW_LINE***  const lastName = nameParts.slice(1).join(\'\')***NEW_LINE***  return { firstName, lastName }***NEW_LINE***};", "inputs": [ { "key": "fullName","value": "John Doe" } ], "packages": [] }',
                },
            },
            {
                role: 'user',
                content:
                    'from an array of objects, take the created_at property for each object and print it as an ISO string',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE***  const isoStrings = inputs.array.map(obj => new Date(obj.created_at).toISOString())***NEW_LINE***  return isoStrings;***NEW_LINE***};", "inputs": [ { "key": "array","value": "[{ "created_at": "2022-01-14T12:34:56Z" }, { "created_at": "2022-01-15T09:45:30Z" } ]" } ], "packages": [] }',
                },
            },
            {
                role: 'user',
                content: 'Hi',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE*** return \'Hi\'***NEW_LINE***};", "inputs": [], "packages": [] }',
                },
            },
            {
                role: 'user',
                content: 'How are you?',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "export const code = async (inputs) => {***NEW_LINE*** return \'How are you?\'***NEW_LINE***};", "inputs": [], "packages": [] }',
                },
            },
            {
                role: 'user',
                content:
                    'Using axios, send a GET request to https://cloud.activepieces.com/api/v1/pieces',
            },
            {
                role: 'assistant',
                content: null,
                function_call: {
                    name: 'generate_code',
                    arguments:
                        '{ "code": "import axios from \'axios\'***NEW_LINE***export const code = async (inputs) => {***NEW_LINE***  const response = await axios.get(\'https://cloud.activepieces.com/api/v1/pieces\');***NEW_LINE***  return response.data;***NEW_LINE***};", "inputs": [], "packages": ["axios"] }',
                },
            },
        ]
    },
}