import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';
import { bloomerangAuth } from '../../';

export const bloomerangCreateTransaction = createAction({
    auth: bloomerangAuth,
        name: 'create_transaction',
        description: 'Create a transaction',
        displayName: 'Create a transaction (Advanced)',
        props: {
            transaction: Property.Json({
                displayName: "Transaction (JSON)",
                description: "The Transaction JSON",
                defaultValue: {
                    "AccountId": 0,
                    "Date": "2023-06-13",
                    "Amount": 0,
                    "Method": "None",
                    "EntryMethod": "Tap",
                    "MethodOrigin": "Forms",
                    "CheckNumber": "string",
                    "CheckDate": "2023-06-13",
                    "CreditCardType": "Visa",
                    "CreditCardLastFourDigits": "string",
                    "CreditCardExpMonth": 0,
                    "CreditCardExpYear": 0,
                    "EftAccountType": "Checking",
                    "EftLastFourDigits": "string",
                    "EftRoutingNumber": "string",
                    "InKindDescription": "string",
                    "InKindType": "Goods",
                    "InKindMarketValue": 0,
                    "WalletItemId": 0,
                    "IntegrationUrl": "string",
                    "Designations": [
                        {
                            "Amount": 0,
                            "Note": "string",
                            "AcknowledgementStatus": "Yes",
                            "AcknowledgementInteractionIds": [
                                0
                            ],
                            "Type": "Donation",
                            "NonDeductibleAmount": 0,
                            "FundId": 0,
                            "QuickbooksAccountId": 0,
                            "CampaignId": 0,
                            "AppealId": 0,
                            "TributeId": 0,
                            "SoftCredits": [
                                null
                            ],
                            "CustomValues": [
                                {
                                    "FieldId": 0,
                                    "Value": "string"
                                },
                                {
                                    "FieldId": 0,
                                    "ValueId": 0
                                },
                                {
                                    "FieldId": 0,
                                    "ValueIds": [
                                        0
                                    ]
                                }
                            ],
                            "Attachments": [
                                null,
                                null
                            ]
                        },
                        {
                            "PledgeFrequency": "Weekly",
                            "Amount": 0,
                            "Note": "string",
                            "AcknowledgementStatus": "Yes",
                            "AcknowledgementInteractionIds": [
                                0
                            ],
                            "Type": "Pledge",
                            "PledgeInstallments": [
                                {
                                    "Date": "2023-06-13",
                                    "Amount": 0
                                }
                            ],
                            "NonDeductibleAmount": 0,
                            "FundId": 0,
                            "QuickbooksAccountId": 0,
                            "CampaignId": 0,
                            "AppealId": 0,
                            "TributeId": 0,
                            "SoftCredits": [
                                null
                            ],
                            "CustomValues": [
                                {
                                    "FieldId": 0,
                                    "Value": "string"
                                },
                                {
                                    "FieldId": 0,
                                    "ValueId": 0
                                },
                                {
                                    "FieldId": 0,
                                    "ValueIds": [
                                        0
                                    ]
                                }
                            ],
                            "Attachments": [
                                null,
                                null
                            ]
                        },
                        {
                            "Amount": 0,
                            "Note": "string",
                            "AcknowledgementStatus": "Yes",
                            "AcknowledgementInteractionIds": [
                                0
                            ],
                            "Type": "PledgePayment",
                            "PledgeId": 0,
                            "CustomValues": [
                                {
                                    "FieldId": 0,
                                    "Value": "string"
                                },
                                {
                                    "FieldId": 0,
                                    "ValueId": 0
                                },
                                {
                                    "FieldId": 0,
                                    "ValueIds": [
                                        0
                                    ]
                                }
                            ],
                            "Attachments": [
                                null,
                                null
                            ]
                        },
                        {
                            "RecurringDonationEndDate": "2023-06-13",
                            "Amount": 0,
                            "Note": "string",
                            "AcknowledgementStatus": "Yes",
                            "AcknowledgementInteractionIds": [
                                0
                            ],
                            "RecurringDonationFrequency": "Weekly",
                            "RecurringDonationDay1": 0,
                            "RecurringDonationDay2": 0,
                            "RecurringDonationStartDate": "2023-06-13",
                            "Type": "RecurringDonation",
                            "FundId": 0,
                            "QuickbooksAccountId": 0,
                            "CampaignId": 0,
                            "AppealId": 0,
                            "TributeId": 0,
                            "SoftCredits": [
                                null
                            ],
                            "CustomValues": [
                                {
                                    "FieldId": 0,
                                    "Value": "string"
                                },
                                {
                                    "FieldId": 0,
                                    "ValueId": 0
                                },
                                {
                                    "FieldId": 0,
                                    "ValueIds": [
                                        0
                                    ]
                                }
                            ],
                            "Attachments": [
                                null,
                                null
                            ]
                        },
                        {
                            "Amount": 0,
                            "Note": "string",
                            "AcknowledgementStatus": "Yes",
                            "AcknowledgementInteractionIds": [
                                0
                            ],
                            "Type": "RecurringDonationPayment",
                            "RecurringDonationId": 0,
                            "FundId": 0,
                            "QuickbooksAccountId": 0,
                            "CampaignId": 0,
                            "AppealId": 0,
                            "IsExtraPayment": true,
                            "CustomValues": [
                                {
                                    "FieldId": 0,
                                    "Value": "string"
                                },
                                {
                                    "FieldId": 0,
                                    "ValueId": 0
                                },
                                {
                                    "FieldId": 0,
                                    "ValueIds": [
                                        0
                                    ]
                                }
                            ],
                            "Attachments": [
                                null,
                                null
                            ]
                        }
                    ],
                    "Attachments": [
                        {
                            "Guid": "string",
                            "Name": "string",
                            "Extension": "string",
                            "Url": "string"
                        },
                        {
                            "Id": 0,
                            "Name": "string",
                            "Extension": "string",
                            "Url": "string"
                        }
                    ]
                },
                required: true
            })
        },
        async run({ auth, propsValue }) {
            const { transaction } = propsValue
            return (await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${bloomerangCommon.baseUrl}/transaction`,
                headers: {
                    "X-API-KEY": auth,
                },
                body: transaction
            })).body
        },
});
