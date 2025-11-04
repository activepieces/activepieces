import { DynamicPropsValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../';
import { TarventClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof tarventAuth>) {
    const client = new TarventClient(auth.accountId, auth.apiKey);
    return client;
}

export const tarventCommon = {
    customEventId: (required = false, description = '') => Property.Dropdown({
        displayName: 'Custom event',
        description,
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }
            const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
            const res = await client.listCustomEvents();

            return {
                disabled: false,
                options: res.data.customApiEvents.nodes.map((customApiEvents) => {
                    return {
                        label: customApiEvents.name,
                        value: customApiEvents.key,
                    };
                }),
            };
        },
    }),
    campaignId: (required = false, description = '', ignoreStatus = false, isEvent = false) =>
        Property.Dropdown({
            displayName: 'Campaign',
            description,
            required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listCampaigns(ignoreStatus, isEvent);
                console.log(res);
                return {
                    disabled: false,
                    options: res.data.campaigns.nodes.map((campaigns) => {
                        return {
                            label: campaigns.name,
                            value: campaigns.id,
                        };
                    }),
                };
            },
        }),
    campaignLinkId: (required = false) =>
        Property.Dropdown({
            displayName: 'Campaign link',
            description: 'Only used if campaign type is set to "Specific". If specified, the trigger will only fire if a contact clicks the selected link.',
            required,
            refreshers: ['campaignId'],
            options: async ({ auth, campaignId }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listCampaignLinks(campaignId as string);

                return {
                    disabled: false,
                    options: res.data.campaignLinks.nodes.map((link) => {
                        return {
                            label: link.url,
                            value: link.id,
                        };
                    }),
                };
            },
        }),
    journeyId: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Journey',
            description,
            required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listJourneys();

                return {
                    disabled: false,
                    options: res.data.journeys.nodes.map((journey) => {
                        return {
                            label: journey.name,
                            value: journey.id,
                        };
                    }),
                };
            },
        }),
    campaignScope: Property.DynamicProperties({
        displayName: 'Campaign scope',
        refreshers: ['campaignType'],
        required: false,
        props: async ({ campaignType }) => {
            const prop: DynamicPropsValue = {};

            if (campaignType as unknown === 'AnyX') {
                prop['campaignRange'] = Property.Number({
                    displayName: 'Range',
                    required: true,
                });
                prop['campaignPeriod'] = Property.StaticDropdown({
                    displayName: 'Period',
                    description: '',
                    required: true,
                    options: {
                        options: [
                            {
                                label: 'Hour(s)',

                                value: 'h',
                            },
                            {
                                label: 'Day(s)',
                                value: 'd',
                            },
                            {
                                label: 'Week(s)',
                                value: 'w',
                            },
                            {
                                label: 'Month(s)',
                                value: 'm',
                            },
                        ],
                    },
                    defaultValue: 'd'
                });
            }

            return prop;
        },
    }),
    audienceId: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Audience',
            description,
            required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listAudiences();

                return {
                    disabled: false,
                    options: res.data.audiences.nodes.map((audience) => {
                        return {
                            label: audience.name,
                            value: audience.id,
                        };
                    }),
                };
            },
        }),
    audienceGroupId: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Audience group',
            description,
            required,
            refreshers: ['audienceId'],
            options: async ({ auth, audienceId }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                if (!audienceId) {
                    return {
                        disabled: true,
                        placeholder: 'Please select an audience first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listAudienceGroups(audienceId as string);

                return {
                    disabled: false,
                    options: res.data.audienceGroups.nodes.map((group) => {
                        return {
                            label: group.name,
                            value: group.id,
                        };
                    }),
                };
            },
        }),
    audienceFormId: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Audience form',
            description,
            required,
            refreshers: ['audienceId'],
            options: async ({ auth, audienceId }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                if (!audienceId) {
                    return {
                        disabled: true,
                        placeholder: 'Please select an audience first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listAudienceForms(audienceId as string);

                return {
                    disabled: false,
                    options: res.data.forms.nodes.map((form) => {
                        return {
                            label: form.name,
                            value: form.id,
                        };
                    }),
                };
            },
        }),
    audienceGroupIds: (required = false, description = '') =>
        Property.MultiSelectDropdown({
            displayName: 'Audience group',
            description,
            required,
            refreshers: ['audienceId'],
            options: async ({ auth, audienceId }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                if (!audienceId) {
                    return {
                        disabled: true,
                        placeholder: 'Please select an audience first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listAudienceGroups(audienceId as string);

                return {
                    disabled: false,
                    options: res.data.audienceGroups.nodes.map((group) => {
                        return {
                            label: group.name,
                            value: group.id,
                        };
                    }),
                };
            },
        }),
    audienceDataFields: Property.DynamicProperties({
        displayName: 'Data fields',
        refreshers: ['audienceId'],
        required: false,
        props: async ({ auth, audienceId }) => {
            if (!auth) return {};

            const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
            const res = await client.listAudienceDataFields(audienceId as unknown);

            const fields: DynamicPropsValue = {};
            const fieldsFromApi = res.data.audienceDataFields.nodes;

            if (fieldsFromApi) {
                fieldsFromApi.forEach((f) => {
                    if (!f.isSystem && !f.isGdprField) {
                        switch (f.dataType) {
                            case 'NUMBER': {
                                fields[f.id] = Property.Number({
                                    displayName: f.labelText,
                                    required: f.required,
                                    description: client.getHelpText(
                                        f.labelText,
                                        f.dataType,
                                        f.defaultValue
                                    ),
                                });
                                break;
                            }
                            case 'DATE':
                            case 'DATE_TIME': {
                                fields[f.id] = Property.DateTime({
                                    displayName: f.labelText,
                                    required: f.required,
                                    description: client.getHelpText(
                                        f.labelText,
                                        f.dataType,
                                        f.defaultValue
                                    ),
                                });
                                break;
                            }
                            default: {
                                fields[f.id] = Property.ShortText({
                                    displayName: f.labelText,
                                    required: f.required,
                                    description: client.getHelpText(
                                        f.labelText,
                                        f.dataType,
                                        f.defaultValue
                                    ),
                                });
                                break;
                            }
                        }

                    }
                    if (f.isGdprField) {
                        fields[f.id] = {
                            displayName: f.labelText.replace('GDPR_', '') + ' (GDPR Permission)',
                            required: f.required,
                            description: client.getHelpText(
                                f.labelText.replace('GDPR_', ''),
                                f.dataType,
                                f.defaultValue,
                                true
                            ),
                        };
                    }
                });
            }
            return fields;
        },
    }),

    contactId: Property.ShortText({
        displayName: 'Contact ID',
        description: 'Find this in the edit contact dialog on the details page.',
        required: true,
        defaultValue: '',
    }),
    name: (displayName: string, required: boolean, description = '') =>
        Property.ShortText({
            displayName,
            description,
            required,
            defaultValue: '',
        }),
    description: (displayName: string, required: boolean, description = '') =>
        Property.LongText({
            displayName,
            description,
            required,
            defaultValue: '',
        }),
    include: Property.StaticDropdown({
        displayName: 'Include all contact data',
        description: 'If not included, only the contact ID, email and unique identifier will be passed back.',
        required: true,
        defaultValue: 'BASIC',
        options: {
            options: [
                {
                    label: 'Include',

                    value: 'EXTENDED',
                },
                {
                    label: 'Do not include',
                    value: 'BASIC',
                },
            ],
        },
    }),
    entity: Property.StaticDropdown({
        displayName: 'Email type',
        description: 'Select if a campaign, transactional email or both should fire the trigger.',
        required: true,
        defaultValue: 'BOTH',
        options: {
            options: [
                {
                    label: 'Both',

                    value: 'BOTH',
                },
                {
                    label: 'Campaign',
                    value: 'CAMPAIGN',
                },
                {
                    label: 'Transaction',
                    value: 'TRANSACTION',
                },
            ],
        },
    }),
    tagId: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Tags',
            description,
            required,
            refreshers: [],
            options: async ({ auth, searchField }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listTags();

                console.log(res, searchField)

                return {
                    disabled: false,
                    options: res.data.tags.nodes.map((tag) => {
                        return {
                            label: tag.name,
                            value: tag.name,
                        };
                    }),
                };
            },
        }),
    tagIds: (required = false, description = '') =>
        Property.MultiSelectDropdown({
            displayName: 'Tags',
            description,
            required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listTags();

                return {
                    disabled: false,
                    options: res.data.tags.nodes.map((tag) => {
                        return {
                            label: tag.name,
                            value: tag.name,
                        };
                    }),
                };
            },
        }),
    txGroupName: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Transaction group name',
            description,
            required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listTxGroupNames();
                console.log(res);
                return {
                    disabled: false,
                    options: res.data.transactionGroupNames ? res.data.transactionGroupNames.map((name) => {
                        return {
                            label: name,
                            value: name,
                        };
                    }) : [],
                };
            },
        }),
    templateId: (required = false, description = '') =>
        Property.Dropdown({
            displayName: 'Template',
            description,
            required,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }
                const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
                const res = await client.listTemplates();

                return {
                    disabled: false,
                    options: res.data.templates.nodes.map((template) => {
                        return {
                            label: template.name,
                            value: template.id,
                        };
                    }),
                };
            },
        }),
    landingPageId: Property.Dropdown({
        displayName: 'Landing page',
        description: 'If specified, the trigger will only fire if CTA (call-to-action) is performed on the selected landing page.',
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }
            const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
            const res = await client.listLandingPages();

            return {
                disabled: false,
                options: res.data.landingPages.nodes.map((lp) => {
                    return {
                        label: lp.name,
                        value: lp.id,
                    };
                }),
            };
        },
    }),
    surveyId: Property.Dropdown({
        displayName: 'Survey',
        description: 'If specified, the trigger will only fire if the selected survey is submitted.',
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first',
                    options: [],
                };
            }
            const client = makeClient(auth as PiecePropValueSchema<typeof tarventAuth>);
            const res = await client.listSurveys();

            return {
                disabled: false,
                options: res.data.surveys.nodes.map((s) => {
                    return {
                        label: s.name,
                        value: s.id,
                    };
                }),
            };
        },
    }),
};
