import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';
import { bloomerangAuth } from '../../';

export const bloomerangGetContacts = createAction({
    auth: bloomerangAuth,
    action: {
        name: 'get_contacts',
        description: 'Get all contacts after date',
        displayName: 'Get contacts',
        props: {
            last_modified_date: Property.ShortText({
                displayName: "Last Modified Date",
                description: "The date to search for contacts modified after",
                defaultValue: "1970-01-01T00:00:00.000Z",
                required: true
            })
        },
        sampleData: [
            {
                "Total": 0,
                "TotalFiltered": 0,
                "Start": 0,
                "ResultCount": 0,
                "Results": [
                    {
                        "Id": 0,
                        "AccountNumber": 0,
                        "IsInHousehold": true,
                        "IsHeadOfHousehold": true,
                        "IsFavorite": true,
                        "FullCustomProfileImageId": 0,
                        "FullCustomProfileImageUrl": "string",
                        "CroppedCustomProfileImageId": 0,
                        "CroppedCustomProfileImageUrl": "string",
                        "Type": "Individual",
                        "Status": "Active",
                        "FirstName": "string",
                        "LastName": "string",
                        "MiddleName": "string",
                        "Prefix": "string",
                        "Suffix": "string",
                        "FullName": "string",
                        "InformalName": "string",
                        "FormalName": "string",
                        "EnvelopeName": "string",
                        "RecognitionName": "string",
                        "JobTitle": "string",
                        "Employer": "string",
                        "Website": "string",
                        "FacebookId": "string",
                        "TwitterId": "string",
                        "LinkedInId": "string",
                        "Gender": "Male",
                        "Birthdate": "2023-06-12",
                        "ProfilePictureType": "None",
                        "PrimaryEmail": {
                            "Id": 0,
                            "AccountId": 0,
                            "Type": "Home",
                            "Value": "user@example.com",
                            "IsPrimary": true,
                            "IsBad": true
                        },
                        "PrimaryPhone": {
                            "Id": 0,
                            "AccountId": 0,
                            "Type": "Home",
                            "Extension": "string",
                            "Number": "string",
                            "IsPrimary": true
                        },
                        "HouseholdId": 0,
                        "PreferredCommunicationChannel": "Email",
                        "CommunicationRestrictions": [
                            "DoNotCall"
                        ],
                        "CommunicationRestrictionsUpdateReason": "string",
                        "EmailInterestType": "All",
                        "CustomEmailInterests": [
                            {
                                "Id": 0,
                                "Name": "string"
                            }
                        ],
                        "EmailInterestsUpdateReason": "string",
                        "EngagementScore": "Low",
                        "DonorSearchInfo": {
                            "Id": 0,
                            "GenerosityScore": "Low",
                            "AnnualFundLikelihood": "Low",
                            "MajorGiftLikelihood": "Low",
                            "Quality": "Low",
                            "LargestGiftMin": 0,
                            "LargestGiftMax": 0,
                            "WealthAskMin": 0,
                            "WealthAskMax": 0,
                            "BusinessExecutive": true,
                            "NamesScreened": "string",
                            "DateTimeScreenedUtc": "string"
                        },
                        "AddressIds": [
                            0
                        ],
                        "EmailIds": [
                            0
                        ],
                        "PhoneIds": [
                            0
                        ],
                        "CustomValues": [
                            {
                                "FieldId": 0,
                                "Value": {
                                    "Id": 0,
                                    "Value": "string"
                                }
                            },
                            {
                                "FieldId": 0,
                                "Values": [
                                    {
                                        "Id": 0,
                                        "Value": "string"
                                    }
                                ]
                            }
                        ],
                        "AuditTrail": {
                            "CreatedDate": "2023-06-12T12:39:03.562Z",
                            "CreatedName": "string",
                            "LastModifiedDate": "2023-06-12T12:39:03.562Z",
                            "LastModifiedName": "string"
                        }
                    }
                ]
            }
        ],
        async run({ auth, propsValue }) {
            const { last_modified_date } = propsValue
            return (await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${bloomerangCommon.baseUrl}/constituents?lastModified=${last_modified_date}`,
                headers: {
                    "X-API-KEY": auth,
                },
            })).body;
        },
    },
});

