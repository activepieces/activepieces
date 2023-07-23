import { createAction, Property } from '@activepieces/pieces-framework';
import { salsaCommon } from '../common/common';
import { salsaAuth } from '../..';
import { searchSupporter } from './supporter';

export const salsaSupporterSearch = createAction({
    auth: salsaAuth,
        name: 'supporter-search',
        description: 'Get all supporters after date',
        displayName: 'Get supporters',
        props: {
            baseUrl: salsaCommon.baseUrl,
            identifiers: Property.Array({
                displayName: "A list of ids to search for",
                description: "Filters results based on the ID for the supporters",
                required: false
            }),
            identifierType: salsaCommon.identifierType,
            searchString: Property.ShortText({
                displayName: "The string to search for",
                description: "The value to search for if identifierType is SEARCH_STRING. If you provide 2 words separated by a space, it will search first and last names respectively. A single search term will search first name, last name and email",
                required: false
            }),
            modifiedFrom: Property.ShortText({
                displayName: "Starting Modified Date",
                description: "Starting date time to base a search",
                defaultValue: "1970-01-01T00:00:00.000Z",
                required: true
            }),
            modifiedTo: Property.ShortText({
                displayName: "Last Modified Date",
                description: "End date time for a search. Optional and if not provided defaults to now",
                required: false
            }),
            offset: Property.Number({
                displayName: "The starting index of items",
                description: "Starting index to retrieve values from. This allows you to paginate larger results set",
                defaultValue: 0,
                required: false
            }),
            count: Property.Number({
                displayName: "The count of items",
                description: "The maximum number of items to retrieve.",
                defaultValue: 0,
                required: false
            }),
            includeCellOnly: Property.Checkbox({
                displayName: "Include cell-phone",
                description: "Should cell-phone only supporters be included in the results",
                defaultValue: true,
                required: false,
            }),
            includeNormal: Property.Checkbox({
                displayName: "Include Normal",
                description: "Should normal supporters be included in the results",
                defaultValue: true,
                required: false,
            })
        },
        sampleData: [
            {
                "total": 1,
                "supporters": [
                    {
                        "readOnly": false,
                        "supporterId": "98f588e2-6517-4147-a499-d6feaac85174",
                        "firstName": "Jackson",
                        "lastName": "Whole",
                        "createdDate": "2022-08-30T09:28:53.338Z",
                        "lastModified": "2022-08-30T09:30:02.215Z",
                        "address": {
                            "addressLine1": "380 W Broadway",
                            "addressLine2": "",
                            "city": "",
                            "state": "WY",
                            "postalCode": "",
                            "country": "US"
                        },
                        "contacts": [
                            {
                                "type": "CELL_PHONE",
                                "value": "5553332222",
                                "optInDate": "2022-08-30T09:28:53.329Z",
                                "lastChangeReason": "Client API Integration"
                            },
                            {
                                "type": "EMAIL",
                                "value": "jackson.whole@test.com",
                                "status": "OPT_IN",
                                "optInDate": "2022-08-30T09:28:53.329Z",
                                "lastChangeReason": "Client API Integration"
                            }
                        ],
                        "customFieldValues": [],
                        "result": "FOUND"
                    }
                ],
                "count": 1
            }
        ],
        async run({auth, propsValue}) {
            return await searchSupporter(auth, propsValue);
        }
});

