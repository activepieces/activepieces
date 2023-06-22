import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';

export const bloomerangGetContacts = createAction({
    name: 'get_contacts',
    description: 'Get all contacts after date',
    displayName: 'Get contacts',
    props: {
        authentication: bloomerangCommon.authentication,
        last_modified_date: Property.ShortText({
            displayName: "Last Modified Date",
            description: "The date to search for contacts modified after",
            defaultValue: "1970-01-01T00:00:00.000Z",
            required: true
        }),
        skip: Property.Number({
            displayName: "The number of items to skip",
            description: "The number of items to skip before starting to collect the result set.",
            required: false
        }),
        take: Property.Number({
            displayName: "The number of items to include",
            description: "The number of items to include in the result set.",
            required: false
        }),
        is_favorite: Property.Checkbox({
            displayName: "Is favorite",
            description: "Filters constituents to only constituents the user has favorited.",
            defaultValue: false,
            required: false,
        }),
        type: bloomerangCommon.contact_type,
        order_by: Property.ShortText({
            displayName: "Sorts by Id, CreatedDate, or LastModifiedDate (default Id)",
            description: "Available values : Id, CreatedDate, LastModifiedDate",
            required: false
        }),
        order_direction: Property.ShortText({
            displayName: "Sorts the orderBy in ascending or descending order.",
            description: "Available values : Asc, Desc",
            required: false
        }),
        id: Property.Array({
            displayName: "IDs list",
            description: "Filters results based on the ID for the constituent.",
            required: false
        }),
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
    async run(context) {
        const { authentication, last_modified_date, take, id, order_by, skip, type, order_direction, is_favorite} = context.propsValue;
        let url = `${bloomerangCommon.baseUrl}/constituents?lastModified=${last_modified_date}`;
        if(take) url += `&take=${take}`;
        if(skip) url += `&skip=${skip}`;
        if(is_favorite) url += `&isFavorite=${is_favorite}`;
        if(type) url += `&type=${type}`;
        if(order_by) url += `&orderBy=${order_by}`;
        if(order_direction) url += `&orderDirection=${order_direction}`;
        if(id && id.length > 0) {
            const parserId = id.map(el => `id=${el}`)
            url += parserId.join('&');
        }
        return (await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers: {
                "X-API-KEY": authentication,
            },
        })).body;
    }
});

