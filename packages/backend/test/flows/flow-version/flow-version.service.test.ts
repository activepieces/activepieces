import { FlowVersion, FlowVersionState, TriggerType } from '@activepieces/shared'
import { exportedFlowVersionTesting } from '../../../src/app/flows/flow-version/flow-version.service'


test('Duplicate Flow With Branch', () => {
    const flowVersion: FlowVersion = {
        'id':'pj0KQ7Aypoa9OQGHzmKDl',
        'created':'2023-05-24T00:16:41.353Z',
        'updated':'2023-05-24T00:16:41.353Z',
        'flowId':'lod6JEdKyPlvrnErdnrGa',
        'displayName':'Standup Reminder',
        'trigger':{
            'name':'trigger',
            'type': TriggerType.PIECE,
            'valid':true,
            'settings':{
                'input':{
                    'cronExpression':'25 10 * * 0,1,2,3,4',
                },
                'pieceName':'schedule',
                'inputUiInfo':{
                 
                },
                'triggerName':'cron_expression',
                'pieceVersion':'0.0.2',
            },
            'nextAction':{
                'name':'step_1',
                'type':'BRANCH',
                'valid':true,
                'settings':{
                    'conditions':[
                        [
                            {
                                'operator':'TEXT_CONTAINS',
                                'firstValue':'1',
                                'secondValue':'1',
                            },
                        ],
                    ],
                },
                'nextAction':{
                    'name':'step_4',
                    'type':'PIECE',
                    'valid':true,
                    'settings':{
                        'input':{
                            'key':'1',
                        },
                        'pieceName':'store',
                        'actionName':'get',
                        'inputUiInfo':{
                            'customizedInputs':{
                          
                            },
                        },
                        'pieceVersion':'0.2.6',
                    },
                    'displayName':'Get',
                },
                'displayName':'Branch',
                'onFailureAction':{
                    'name':'step_3',
                    'type':'CODE',
                    'valid':true,
                    'settings':{
                        'input':{
                       
                        },
                        'artifactSourceId':'pJskIPz1ZL3RYiyUX1HPm',
                    },
                    'displayName':'Code',
                },
                'onSuccessAction':{
                    'name':'step_2',
                    'type':'PIECE',
                    'valid':true,
                    'settings':{
                        'input':{
                            'content':'MESSAGE',
                            'webhook_url':'WEBHOOK_URL',
                        },
                        'pieceName':'discord',
                        'actionName':'send_message_webhook',
                        'inputUiInfo':{
                            'customizedInputs':{
                          
                            },
                        },
                        'pieceVersion':'0.2.1',
                    },
                    'displayName':'Send Message Webhook',
                },
            },
            'displayName':'Cron Expression',
        },
        'valid':true,
        'state': FlowVersionState.DRAFT,
    }
    const expectedImportOperations =     [
        {
            'type': 'ADD_ACTION',
            'request': {
                'parentStep': 'trigger',
                'action': {
                    'type': 'BRANCH',
                    'name': 'step_1',
                    'displayName': 'Branch',
                    'settings': {
                        'conditions': [
                            [
                                {
                                    'operator': 'TEXT_CONTAINS',
                                    'firstValue': '1',
                                    'secondValue': '1',
                                },
                            ],
                        ],
                    },
                    'valid': true,
                },
            },
        },
        {
            'type': 'ADD_ACTION',
            'request': {
                'parentStep': 'step_1',
                'action': {
                    'type': 'PIECE',
                    'name': 'step_4',
                    'displayName': 'Get',
                    'settings': {
                        'input': {
                            'key': '1',
                        },
                        'pieceName': 'store',
                        'actionName': 'get',
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                        'pieceVersion': '0.2.6',
                    },
                    'valid': true,
                },
            },
        },
        {
            'type': 'ADD_ACTION',
            'request': {
                'parentStep': 'step_1',
                'stepLocationRelativeToParent': 'INSIDE_FALSE_BRANCH',
                'action': {
                    'type': 'CODE',
                    'name': 'step_3',
                    'displayName': 'Code',
                    'settings': {
                        'input': {},
                        'artifactSourceId': 'pJskIPz1ZL3RYiyUX1HPm',
                    },
                    'valid': true,
                },
            },
        },
        {
            'type': 'ADD_ACTION',
            'request': {
                'parentStep': 'step_1',
                'stepLocationRelativeToParent': 'INSIDE_TRUE_BRANCH',
                'action': {
                    'type': 'PIECE',
                    'name': 'step_2',
                    'displayName': 'Send Message Webhook',
                    'settings': {
                        'input': {
                            'content': 'MESSAGE',
                            'webhook_url': 'WEBHOOK_URL',
                        },
                        'pieceName': 'discord',
                        'actionName': 'send_message_webhook',
                        'inputUiInfo': {
                            'customizedInputs': {},
                        },
                        'pieceVersion': '0.2.1',
                    },
                    'valid': true,
                },
            },
        },
    ]
    const importOperations = exportedFlowVersionTesting.getImportOperations(flowVersion.trigger)
    expect(importOperations).toEqual(expectedImportOperations)
})
test('Duplicate Flow With Loops using Import', () => {
    const flowVersion: FlowVersion = {
        'id': '2XuLcKZWSgKkiHh6RqWXg',
        'created': '2023-05-23T00:14:47.809Z',
        'updated': '2023-05-23T00:14:47.809Z',
        'flowId': 'YGPIPQDfLcPdJ0aJ9AKGb',
        'displayName': 'Flow 1',
        'trigger': {
            'name': 'trigger',
            'type': TriggerType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'repository': {
                        'repo': 'activepieces',
                        'owner': 'activepieces',
                    },
                    'authentication': '{{connections.github}}',
                },
                'pieceName': 'github',
                'inputUiInfo': {

                },
                'triggerName': 'trigger_star',
                'pieceVersion': '0.1.3',
            },
            'nextAction': {
                'name': 'step_1',
                'type': 'LOOP_ON_ITEMS',
                'valid': false,
                'settings': {
                    'items': '',
                },
                'nextAction': {
                    'name': 'step_3',
                    'type': 'CODE',
                    'valid': true,
                    'settings': {
                        'input': {

                        },
                        'artifact': 'BASE64',
                    },
                    'displayName': 'Code',
                },
                'displayName': 'Loop on Items',
                'firstLoopAction': {
                    'name': 'step_2',
                    'type': 'CODE',
                    'valid': true,
                    'settings': {
                        'input': {

                        },
                        'artifact': 'BASE64',
                    },
                    'displayName': 'Code',
                },
            },
            'displayName': 'Trigger',
        },
        'valid': false,
        'state': FlowVersionState.DRAFT,
    }
    const expectedResult = [
        {
            type: 'ADD_ACTION',
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: 'LOOP_ON_ITEMS',
                    valid: false,
                    settings: {
                        items: '',
                    },
                    displayName: 'Loop on Items',
                },
            },
        },
        {
            type: 'ADD_ACTION',
            request: {
                parentStep: 'step_1',
                action: {
                    name: 'step_3',
                    type: 'CODE',
                    valid: true,
                    settings: {
                        input: {},
                        artifact: 'BASE64',
                    },
                    displayName: 'Code',
                },
            },
        },
        {
            type: 'ADD_ACTION',
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: 'INSIDE_LOOP',
                action: {
                    name: 'step_2',
                    type: 'CODE',
                    valid: true,
                    settings: {
                        input: {},
                        artifact: 'BASE64',
                    },
                    displayName: 'Code',
                },
            },
        },
    ]
    
    const importOperations = exportedFlowVersionTesting.getImportOperations(flowVersion.trigger)
    expect(importOperations).toEqual(expectedResult)
})

