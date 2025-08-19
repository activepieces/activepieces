export type CreateWebhookResponse = {
    data: {
        createWebhook: {
            id: string;
        }
    }

};

export type ListAudiencesResponse = {
    data: {
        audiences: {
            nodes: {
                name: string;
                id: string;
            }[]
        }
    };
};

export type ListAudiencesAdvResponse = {
    data: {
        audiences: {
            nodes: {
                name: string;
                id: string;
                companyName: string;
                streetAddress: string;
                streetAddress2: string;
                addressLocality: string;
                addressRegion: string;
                postalCode: string;
                addressCountry: string;
                phone: string;
                website: string;
                totalContacts: number;
                totalActiveContacts: number;
                totalUnconfirmedContacts: number;
                totalUndeliverableContacts: number;
                totalUnsubscribedContacts: number;
                totalComplaintContacts: number;
                totalSuppressedContacts: number;
                tags: string[];
                customKeyDataField: { id: string, labelText: string };
                createdUtc: string;
                lastModifiedUtc: string;
            }[]
        }
    };
};


export type ListAudienceGroupResponse = {
    data: {
        audienceGroups: {
            nodes: {
                name: string;
                id: string;
            }[]
        }
    };
};

export type ListAudienceGroupAdvResponse = {
    data: {
        audienceGroups: {
            nodes: {
                name: string;
                id: string;
                description: string;
                isPublic: boolean;
            }[]
        }
    };
};

export type ListAudienceDataFieldsResponse = {
    data: {
        audienceDataFields: {
            nodes: {
                labelText: string;
                id: string;
                dataType: string;
                required: boolean;
                isSystem: boolean;
                defaultValue: string;
                mergeTag: string;
                isPrimaryKey: boolean;
                isGdprField: boolean;
                category: boolean;
            }[]
        }
    };
};


export type ListAudienceFormsResponse = {
    data: {
        forms: {
            nodes: {
                name: string;
                id: string;
            }[]
        }
    };
};

export type ListTagsResponse = {
    data: {
        tags: {
            nodes: {
                name: string;
            }[]
        }
    };
};

export type ListCampaignsResponse = {
    data: {
        campaigns: {
            nodes: {
                id: string;
                name: string;
            }[]
        }
    };
};

export type ListCampaignsAdvResponse = {
    data: {
        campaigns: {
            nodes: {
                id: string;
                name: string;
                tags: string[];
                audienceId: string;
                description: string;
                enableMvTesting: boolean;
                mvWinType: string;
                timeJumper: boolean;
                sendStatus: string;
                scheduledToSendUtc: string;
                createdUtc: string;
                modifiedUtc: string;
            }[]
        }
    };
};

export type ListCampaignLinksResponse = {
    data: {
        campaignLinks: {
            nodes: {
                id: string;
                url: string;
                track: boolean;
                entityName: string;
                entityType: string;
                formType: string;
            }[]
        }
    };
};

export type ListJourneysResponse = {
    data: {
        journeys: {
            nodes: {
                id: string;
                name: string;
            }[],
            pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
            }
        }
    };
};

export type ListJourneysAdvResponse = {
    data: {
        journeys: {
            nodes: {
                id: string;
                name: string;
                tags: string[];
                audienceId: string;
                description: string;
                reEntryType: string;
                status: string;
                totalEmailNodes: string;
                totalNotificationEmailNodes: string;
                totalSiteNotificationNodes: string;
                totalSMSNodes: string;
                createdUtc: string;
                modifiedUtc: string;
            }[],
        }
    };
};

export type ListContactResponse = {
    data: {
        contact: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            tags: string[];
            groups: { id: string, name: string }[];
            streetAddress: string;
            streetAddress2: string;
            addressLocality: string;
            addressRegion: string;
            postalCode: string;
            addressCountry: string;
            profileFields: { dataField: {id: string, labelText: string }, value: string }[];
            modifiedUtc: string;
            createdUtc: string;
            longitude: string;
            latitude: string;
            timeZone: string;
            language: string;
            sendFormat: string;
            status: string;
            optInUtc: string;
            confirmedUtc: string;
            optOUtUtc: string;
        }
    };
};


export type ListLandingPagesResponse = {
    data: {
        landingPages: {
            nodes: {
                id: string;
                name: string;
            }[]
        }
    };
};

export type ListSurveysResponse = {
    data: {
        surveys: {
            nodes: {
                id: string;
                name: string;
            }[]
        }
    };
};

export type ListTemplatesResponse = {
    data: {
        templates: {
            nodes: {
                id: string;
                name: string;
            }[]
        }
    };
};

export type ListTxGroupNamesResponse = {
    data: {
        transactionGroupNames: string[]
    };
};

export type ListCustomEventsResponse = {
    data: {
        customApiEvents: {
            nodes: {
                id: string;
                key: string;
                name: string;
            }[]
        }
    };
};

export type ListCustomEventsAdvResponse = {
    data: {
        customApiEvents: {
            nodes: {
                id: string;
                key: string;
                name: string;
                createdUtc: string;
                modifiedUtc: string;
            }[]
        }
    };
};

export type CreateContactResponse = {
    data: {
        createContact: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            tags: string[];
            groups: { id: string, name: string }[];
            streetAddress: string;
            streetAddress2: string;
            addressLocality: string;
            addressRegion: string;
            postalCode: string;
            addressCountry: string;
            profileFields: { dataField: {id: string, labelText: string }, value: string }[];
            modifiedUtc: string;
            createdUtc: string;
        }
    }
};

export type CreateAudienceGroupResponse = {
    data: {
        createAudienceGroup: {
            id: string;
            name: string;
            description: string;
            isPublic: boolean;
            isDynamic: boolean;
        }
    }
};

export type CreateContactNoteResponse = {
    data: {
        createContactNote: {
            id: string;
        }
    }
};

export type CreateGroupContactResponse = {
    data: {
        createGroupContact: {
            id: string;
        }
    }
};

export type DeleteGroupContactResponse = {
    data: {
        deleteGroupContact: {
            id: string;
        }
    }
};

export type CreateSuppressionFilterResponse = {
    data: {
        createAccountSuppressionFilter: {
            id: string;
            localPart: string;
            domain: string;
            reason: string;
        }
    }
};

export enum ContactStatus {
    ACTIVE = 'ACTIVE',
    OPT_OUT = 'OPT_OUT'
}
