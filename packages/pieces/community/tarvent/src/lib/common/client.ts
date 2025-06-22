import {
    httpClient,
    HttpMessageBody,
    HttpMethod,
    HttpRequest
} from '@activepieces/pieces-common';
import { ContactStatus, CreateAudienceGroupResponse, CreateContactNoteResponse, CreateContactResponse, CreateGroupContactResponse, CreateSuppressionFilterResponse, CreateWebhookResponse, DeleteGroupContactResponse, ListAudienceDataFieldsResponse, ListAudienceFormsResponse, ListAudienceGroupAdvResponse, ListAudienceGroupResponse, ListAudiencesAdvResponse, ListAudiencesResponse, ListCampaignLinksResponse, ListCampaignsAdvResponse, ListCampaignsResponse, ListContactResponse, ListCustomEventsAdvResponse, ListCustomEventsResponse, ListJourneysAdvResponse, ListJourneysResponse, ListLandingPagesResponse, ListSurveysResponse, ListTagsResponse, ListTemplatesResponse, ListTxGroupNamesResponse } from './types';

export class TarventClient {
    constructor(private accountId: string, private apiKey: string) { }

    async makeRequest<T extends HttpMessageBody>(
        body: unknown | undefined = undefined,
    ): Promise<T> {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: 'https://api.tarvent.com/graphql',
            headers: {
                'x-api-key': this.apiKey,
                'account': this.accountId
            },
            body: body,
        };
        const res = await httpClient.sendRequest<T>(request);
        return res.body;
    }

    async authenticate() {
        // Call to get account audiences to check if authentication is valid
        const body: unknown = {
            "query": "query GetAudiences{\r\naudiences{\r\nnodes{\r\nid\r\nname}\r\n}\r\n}"
        };
        return await this.makeRequest(body);
    }
    // #region Webhook create and delete
    async createWebhook(context: any, webhookType: string): Promise<CreateWebhookResponse> {
        const body: unknown = {
            "query": "mutation CreateWebhook($name: String!, $description: String!, $events: [WebhookEventInput!]!, $callBackUrl: String!, $dataSettings: WebhookDataSetting, $filter: ConditionGroupInput) { createWebhook( name: $name description: $description events: $events callBackUrl: $callBackUrl dataSettings: $dataSettings filter: $filter ) { id } }",
            "variables": {
                "name": this.getWebhookName(),
                "description": "",
                "callBackUrl": context.webhookUrl,
                "events": this.getWebhookEvent(webhookType, context.propsValue),
                "filter": this.generateWebhookInput(webhookType, context.propsValue),
                "dataSettings": context.propsValue.include,
                "integrationType": "ZAPIER"
            }
        }
        return await this.makeRequest<CreateWebhookResponse>(body);
    }

    async deleteWebhook(webhookId: string): Promise<CreateWebhookResponse> {
        const body: unknown = {
            "query": "mutation DeleteWebhook($id: String!) { deleteWebhook(id: $id) }",
            "variables": {
                "id": webhookId
            }
        }
        return await this.makeRequest<CreateWebhookResponse>(body);
    }
    //#endregion

    // #region Searches and entity lists
    async listAudiences(): Promise<ListAudiencesResponse> {
        const body: unknown = {
            "query": "query GetAudience( $first: Int $after: String $last: Int $before: String $order: [AudienceInfoSortInput!] $where: AudienceInfoFilterInput ) { audiences( first: $first after: $after last: $last before: $before order: $order where: $where ) { nodes { id name } } }",
            "variables": {
                "first": 100,
                "after": null,
                "last": null,
                "before": null,
                "order": null,
                "where": null
            }
        }
        return await this.makeRequest<ListAudiencesResponse>(body);
    }

    async listAudiencesAdv(name = '', tags = '', itemCount = 100): Promise<ListAudiencesAdvResponse> {
        const filters = [];
        if (name && name !== '') filters.push({ name: { contains: name } });
        if (tags && tags !== '') filters.push({ tags: { some: { in: tags.split(',').map((t) => t.trim()) } } });

        const body: unknown = {
            "query": "query GetAudience( $first: Int $after: String $last: Int $before: String $order: [AudienceInfoSortInput!] $where: AudienceInfoFilterInput ) { audiences( first: $first after: $after last: $last before: $before order: $order where: $where ) { nodes { id name companyName streetAddress streetAddress2 addressLocality addressRegion postalCode addressCountry phone website totalContacts totalActiveContacts totalUnconfirmedContacts totalUndeliverableContacts totalUnsubscribedContacts totalComplaintContacts totalSuppressedContacts tags customKeyDataField { id labelText } createdUtc lastModifiedUtc } } }",
            "variables": {
                "first": itemCount,
                "after": null,
                "last": null,
                "before": null,
                "order": null,
                "where": filters.length !== 0 ? { and: filters } : null
            }
        }
        return await this.makeRequest<ListAudiencesAdvResponse>(body);
    }

    async listAudienceGroups(audienceId: string): Promise<ListAudienceGroupResponse> {
        const body: unknown = {
            "query": "query GetAudienceGroups($first: Int, $after: String, $last: Int, $before: String, $audienceId: String!, $order: [AudienceGroupInfoSortInput!], $where: AudienceGroupInfoFilterInput) { audienceGroups( first: $first after: $after last: $last before: $before audienceId: $audienceId order: $order where: $where ) { totalCount nodes { id name } } }",
            "variables": {
                "first": 50,
                "audienceId": audienceId,
                "order": [
                    {
                        "name": "ASC"
                    }
                ],
                "where": {
                    "isDynamic": {
                        "eq": false
                    }
                }
            }
        };
        return await this.makeRequest<ListAudienceGroupResponse>(body);
    }

    async listAudienceGroupsAdv(audienceId: string | undefined, name = ''): Promise<ListAudienceGroupAdvResponse> {
        const filters: any = [{ isDynamic: { eq: false } }];
        if (name && name !== '') filters.push({ name: { contains: name } });
        const body: unknown = {
            "query": "query GetAudienceGroups($first: Int, $after: String, $last: Int, $before: String, $audienceId: String!, $order: [AudienceGroupInfoSortInput!], $where: AudienceGroupInfoFilterInput) { audienceGroups( first: $first after: $after last: $last before: $before audienceId: $audienceId order: $order where: $where ) { totalCount nodes { id name description isPublic } } }",
            "variables": {
                "first": 100,
                "audienceId": audienceId,
                "order": [
                    {
                        "name": "ASC"
                    }
                ],
                "where": { and: filters }
            }
        };
        return await this.makeRequest<ListAudienceGroupAdvResponse>(body);
    }

    async listAudienceDataFields(audienceId: unknown): Promise<ListAudienceDataFieldsResponse> {
        const body: unknown = {
            query: "query GetDataFields($first: Int, $after: String, $last: Int, $before: String, $audienceId: String!, $order: [DataFieldSortInput!], $where: DataFieldFilterInput) { audienceDataFields(first: $first, after: $after, last: $last, before: $before, audienceId: $audienceId, order: $order, where: $where) { nodes { id dataType labelText required isSystem defaultValue mergeTag isPrimaryKey isGdprField category } } }",
            variables: {
                first: 200,
                after: null,
                last: null,
                before: null,
                audienceId,
                order: null,
                where: null
            }
        };
        return await this.makeRequest<ListAudienceDataFieldsResponse>(body);
    }

    async listAudienceForms(audienceId: string): Promise<ListAudienceFormsResponse> {
        const body: unknown = {
            query: `query GetForms($first: Int, $after: String, $last: Int, $before: String, $audienceId: String, $order: [FormInfoSortInput!], $where: FormInfoFilterInput) {
              forms(
                first: $first
                after: $after
                last: $last
                before: $before
                audienceId: $audienceId
                order: $order
                where: $where
              ) {
                nodes {
                  id
                  name
                }
              }
            }`,
            variables: {
                first: 50,
                audienceId,
                order: [{ name: "ASC" }]
            },
        };
        return await this.makeRequest<ListAudienceFormsResponse>(body);
    }

    async listTags(): Promise<ListTagsResponse> {
        const body: unknown = {
            "query": "query GetTags($first: Int $after: String $last: Int $before: String $order: [TagSortInput!] $where: TagFilterInput) { tags(first: $first after: $after last: $last before: $before order: $order where: $where) { nodes { name } } }",
            "variables": {
                "first": 50,
                "after": null,
                "order": null,
                "where": null
            }
        };
        return await this.makeRequest<ListTagsResponse>(body);
    }

    async listCampaigns(ignoreStatus = false, isEvent = false): Promise<ListCampaignsResponse> {
        const filters = [];
        filters.push({ isArchived: { eq: false } });
        if (!ignoreStatus) {
            filters.push({
                sendStatus: {
                    in: isEvent ? ['NOT_SCHEDULED', 'COMPLETED'] : ['NOT_SCHEDULED', 'READY_TO_SEND']
                },
            });
        } else {
            filters.push({
                sendStatus: {
                    nin: ['PAUSED', 'PENDING', 'PROCESSING', 'QUEUED', 'SYSTEM_STOPPED'],
                },
            });
        }
        const body: unknown = {
            query: `query GetCampaigns(
              $first: Int
              $after: String
              $last: Int
              $before: String
              $order: [CampaignInfoSortInput!]
              $where: CampaignInfoFilterInput
            )
              {
                campaigns(
                  first: $first
                  after: $after
                  last: $last
                  before: $before
                  order: $order
                  where: $where
              ) {
                totalCount
                nodes {
                  id
                  name
                }
              }
            }`,
            variables: {
                first: 100,
                after: null,
                order: [
                    {
                        modifiedUtc: 'DESC',
                    },
                ],
                where: {
                    and: filters,
                },
            },
        };
        return await this.makeRequest<ListCampaignsResponse>(body);
    }

    async listCampaignsAdv(name = '', tags = '', status = ''): Promise<ListCampaignsAdvResponse> {
        const filters = [];
        if (name && name !== '') {
            filters.push({ name: { contains: name } });
        }
        if (tags && tags !== '') {
            filters.push({
                tags: {
                    some: { in: tags.split(',').map((t) => t.trim()) },
                },
            });
        }
        if (status && status.length !== 0) {
            const allStatus: string[] = status.split(',').map((s) => s.trim());
            if (status.split(',').some((s) => s === 'PENDING')) {
                allStatus.push('PROCESSING');
                allStatus.push('QUEUED');
            }
            if (status.split(',').some((s) => s === 'STOPPED')) {
                allStatus.push('SYSTEM_STOPPED');
            }
            filters.push({ sendStatus: { in: allStatus } });
        }
        const body: unknown = {
            query: `query GetCampaign( $first: Int $after: String $last: Int $before: String $order: [CampaignInfoSortInput!] $where: CampaignInfoFilterInput ) { campaigns( first: $first after: $after last: $last before: $before order: $order where: $where ) { nodes { id tags name audienceId description mvWinType timeJumper sendStatus scheduledToSendUtc createdUtc modifiedUtc } } }`,
            variables: {
                first: 100,
                after: null,
                order: [
                    {
                        modifiedUtc: 'DESC',
                    },
                ],
                where: filters.length !== 0 ? { and: filters } : null
            },
        };
        return await this.makeRequest<ListCampaignsAdvResponse>(body);
    }

    async listCampaignLinks(campaignId: string): Promise<ListCampaignLinksResponse> {
        const body: unknown = {
            query: `query GetCampaignLinks($id: String!) {
              campaignLinks(id: $id) {
                id
                url
                track
                entityName
                entityType
                formType
              }
            }`,
            variables: {
                id: campaignId,
            },
        };
        return await this.makeRequest<ListCampaignLinksResponse>(body);
    }

    async listJourneys(): Promise<ListJourneysResponse> {
        const body: unknown = {
            query: `query GetJourneys($first: Int, $after: String, $last: Int, $before: String, $order: [JourneyInfoSortInput!], $where: JourneyInfoFilterInput) {
              journeys(
                first: $first
                after: $after
                last: $last
                before: $before
                order: $order
                where: $where
              ) {
                nodes {
                  id
                  name
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }`,
            variables: {
                first: 50,
                after: null,
                last: null,
                before: null,
                order: null,
                where: null,
            },
        };
        return await this.makeRequest<ListJourneysResponse>(body);
    }

    async listJourneysAdv(name = '', tags = '', status = ''): Promise<ListJourneysAdvResponse> {
        const filters = [];
        if (name && name !== '') {
            filters.push({ name: { contains: name } });
        }
        if (tags && tags !== '') {
            filters.push({
                tags: {
                    some: { in: tags.split(',').map((t) => t.trim()) },
                },
            });
        }
        if (status && status.length !== 0) {
            const allStatus: string[] = status.split(',').map((s) => s.trim());
            filters.push({ status: { in: allStatus } });
        }
        const body: unknown = {
            query: `query GetJourneys($first: Int, $after: String, $last: Int, $before: String, $order: [JourneyInfoSortInput!], $where: JourneyInfoFilterInput) { journeys(first: $first, after: $after, last: $last, before: $before, order: $order, where: $where) { nodes { id tags name audienceId description reEntryType status totalEmailNodes totalNotificationEmailNodes totalSiteNotificationNodes totalSMSNodes createdUtc modifiedUtc } } }`,
            variables: {
                first: 1,
                after: null,
                last: null,
                before: null,
                order: null,
                where: filters.length !== 0 ? { and: filters } : null,
            },
        };
        return await this.makeRequest<ListJourneysAdvResponse>(body);
    }

    async listContact(audienceId: string | undefined, email: string): Promise<ListContactResponse> {
        const body: unknown = {
            query: `query GetContact($input: GetContactInput!) { contact(input: $input) { id email firstName lastName groups { id name } tags rating longitude latitude streetAddress streetAddress2 addressLocality addressRegion postalCode addressCountry timeZone language sendFormat status optInUtc confirmedUtc optOutUtc profileFields { id dataField { id labelText } value } modifiedUtc createdUtc } }`,
            variables: {
                input: {
                    audienceId: audienceId,
                    emailAddress: email.includes('@') ? email : null,
                    id: !email.includes('@') ? email : null
                }
            },
        };
        console.log(body);
        return await this.makeRequest<ListContactResponse>(body);
    }

    async listLandingPages(): Promise<ListLandingPagesResponse> {
        const body: unknown = {
            query: `query GetLandingPages($first: Int, $after: String, $last: Int, $before: String, $order: [LandingPageInfoSortInput!], $where: LandingPageInfoFilterInput) {
              landingPages(
                first: $first
                after: $after
                last: $last
                before: $before
                order: $order
                where: $where
              ) {
                nodes {
                  id
                  name
                }
              }
            }`,
            variables: {
                first: 50,
                after: null,
                last: null,
                before: null,
                order: null,
                where: null,
            },
        };
        return await this.makeRequest<ListLandingPagesResponse>(body);
    }

    async listSurveys(): Promise<ListSurveysResponse> {
        const body: unknown = {
            query: `query GetSurveys($first: Int, $after: String, $last: Int, $before: String, $order: [SurveyInfoSortInput!], $where: SurveyInfoFilterInput) {
              surveys(
                first: $first
                after: $after
                last: $last
                before: $before
                order: $order
                where: $where
              ) {
                nodes {
                  id
                  name
                }
              }
            }`,
            variables: {
                first: 50,
                after: null,
                last: null,
                before: null,
                order: null,
                where: null,
            },
        };
        return await this.makeRequest<ListSurveysResponse>(body);
    }

    async listTemplates(): Promise<ListTemplatesResponse> {
        const body: unknown = {
            query: `query GetTemplates($first: Int, $after: String, $last: Int, $before: String, $order: [TemplateInformationSortInput!], $where: TemplateInformationFilterInput) {
              templates(
                first: $first
                after: $after
                last: $last
                before: $before
                order: $order
                where: $where
              ) {
                nodes {
                  id
                  name
                }
              }
            }`,
            variables: {
                first: 50,
                after: null,
                where: null
            },
        };
        return await this.makeRequest<ListTemplatesResponse>(body);
    }

    async listTxGroupNames(): Promise<ListTxGroupNamesResponse> {
        const body: unknown = {
            query: `query GetTxGroupNames($where: StringOperationFilterInput) { transactionGroupNames(where: $where) }`,
            variables: {
                where: null
            },
        };
        return await this.makeRequest<ListTxGroupNamesResponse>(body);
    }

    async listCustomEvents(): Promise<ListCustomEventsResponse> {
        const body: unknown = {
            query: `query GetCustomEvents($first: Int, $after: String, $last: Int, $before: String, $order: [CustomApiEventSortInput!], $where: CustomApiEventFilterInput) {
                customApiEvents(
                first: $first
                after: $after
                last: $last
                before: $before
                order: $order
                where: $where
                ) {
                nodes {
                    id
                    key
                    name
                }
                }
            }`,
            variables: {
                first: 50,
                after: null,
                last: null,
                before: null,
                order: null,
                where: null,
            },
        };
        return await this.makeRequest<ListCustomEventsResponse>(body);
    }

    async listCustomEventsAdv(name = ''): Promise<ListCustomEventsAdvResponse> {
        const filters = [];
        if (name && name !== '') {
            filters.push({ name: { contains: name } });
        }
        const body: unknown = {
            query: `query GetCustomEvents($first: Int, $after: String, $last: Int, $before: String, $order: [CustomApiEventSortInput!], $where: CustomApiEventFilterInput) { customApiEvents(first: $first, after: $after, last: $last, before: $before, order: $order, where: $where) { nodes { id key name createdUtc modifiedUtc } } }`,
            variables: {
                first: 10,
                after: null,
                last: null,
                before: null,
                order: null,
                where: filters.length !== 0 ? { and: filters } : null,
            },
        };
        return await this.makeRequest<ListCustomEventsAdvResponse>(body);
    }
    //#endregion

    // #region Creates and updates
    // Create/update contact
    async createContact(audienceId: string | undefined, emailAddress: string, updateExisting: string, groupAction: string | undefined, tagAction: string | undefined, tagIds: string[] | undefined, groupIds: string[] | undefined, firstName: string | undefined, lastName: string | undefined, streetAddress: string | undefined, streetAddress2: string | undefined, addressLocality: string | undefined, addressRegion: string | undefined, postalCode: string | undefined, addressCountry: string | undefined, profileFields: Record<string, string> | undefined): Promise<CreateContactResponse> {
        const profile = [];
        for (const f in profileFields) {
            if (profileFields[f]) {
                profile.push({
                    dataFieldId: f,
                    value: this.isISODate(profileFields[f].toString()) ? this.formatISODateToYMD(profileFields[f].toString()) : profileFields[f].toString(),
                });
            }
        }
        const body: unknown = {
            query: `mutation CreateContact($input: CreateContactInput!) { createContact(input: $input) { id email firstName lastName tags groups { id name } streetAddress streetAddress2 addressLocality addressRegion postalCode addressCountry profileFields { dataField { id labelText } value } modifiedUtc createdUtc } }`,
            variables: {
                input: {
                    email: emailAddress,
                    audienceId,
                    updateExisting: updateExisting === 'Update',
                    audienceGroupManagementType: groupAction === 'Replace'
                        ? 'REPLACE_EXISTING'
                        : 'ADD_NEW_GROUPS_ONLY',
                    tagManagementType: tagAction === 'Replace'
                        ? 'REPLACE_EXISTING'
                        : 'ADD_NEW_TAGS_ONLY',
                    firstName,
                    lastName,
                    streetAddress,
                    streetAddress2,
                    addressLocality,
                    addressRegion,
                    postalCode,
                    addressCountry,
                    profile,
                    tags: tagIds ? tagIds : null,
                    groupIds: groupIds ? groupIds : null,
                    sendFormat: 'MULTIPART',
                },
            },
        };
        return await this.makeRequest<CreateContactResponse>(body);
    }

    // Update contact tags
    async updateContactTags(audienceId: string | undefined, contactId: string, action: string, tagIds: string[] | undefined): Promise<boolean> {
        const body: unknown = {
            query: "mutation UpdateContactTags($input: UpdateContactTagsInput!) { updateContactTags(input: $input) }",
            variables: {
                input: {
                    id: contactId,
                    audienceId,
                    operator: action === 'Add' ? 'ADD' : 'REMOVE',
                    tags: tagIds
                }
            }
        };
        return await this.makeRequest<boolean>(body);
    }

    // Create audience group
    async createAudienceGroup(audienceId: string | undefined, name: string | undefined, description: string | undefined, isPublic: string): Promise<CreateAudienceGroupResponse> {
        const body: unknown = {
            query: `mutation CreateAudienceGroup($input: CreateGroupInput!) {
              createAudienceGroup(input: $input) {
                id
                name
                description
                isPublic
                isDynamic
              }
            }`,
            variables: {
                input: {
                    name,
                    description,
                    isDynamic: false,
                    isPublic: isPublic === "false" ? false : true,
                    audienceId,
                    criteria: null
                }
            }
        };
        return await this.makeRequest<CreateAudienceGroupResponse>(body);
    }

    // Send campaign copy
    async sendCampaignCopy(campaignId: string | undefined): Promise<boolean> {
        const body: unknown = {
            query: `mutation SendCampaignCopy($id: String!, $sendsUtc: [DateTime!]!) { sendCampaignCopy(id: $id, sendsUtc: $sendsUtc) }`,
            variables: {
                id: campaignId,
                sendsUtc: [new Date().toISOString()]
            }
        };
        return await this.makeRequest<boolean>(body);
    }

    // Add note to contact
    async createContactNote(contactId: string | undefined, note: string | undefined): Promise<CreateContactNoteResponse> {
        const body: unknown = {
            query: `mutation CreateContactNote($input: CreateContactNoteInput!) { createContactNote(input: $input) { id } }`,
            variables: {
                input: {
                    contactId,
                    message: note
                }
            }
        };
        return await this.makeRequest<CreateContactNoteResponse>(body);
    }

    // Add or remove contact from group
    async addRemoveContactGroup(action: string | undefined, contactId: string | undefined, audienceId: string | undefined, groupId: string | undefined): Promise<CreateGroupContactResponse | DeleteGroupContactResponse> {
        let body: unknown = undefined;
        if (action === 'Add') {
            body = {
                query: `mutation CreateGroupContact($input: CreateGroupContactInput!) { createGroupContact(input: $input) { id } }`,
                variables: {
                    input: {
                        id: contactId,
                        groupId: groupId,
                        audienceId: audienceId,
                    }
                }
            };
        } else {
            body = {
                query: `mutation DeleteGroupContact($input: DeleteGroupContactInput!) { deleteGroupContact(input: $input) { id } }`,
                variables: {
                    input: {
                        id: contactId,
                        groupId: groupId,
                        audienceId: audienceId,
                    }
                }
            };
        }
        return await this.makeRequest<CreateGroupContactResponse | DeleteGroupContactResponse>(body);
    }

    // Add or remove contact from journey
    async addRemoveJourneyContact(action: string | undefined, contactId: string | undefined, journeyId: string | undefined): Promise<boolean> {
        let body: unknown = undefined;
        if (action === 'Add') {
            body = {
                query: `mutation EnterContactIntoJourney($id: String!, $journeyId: String!) { enterContactIntoJourney(id: $id, journeyId: $journeyId) }`,
                variables: {
                    id: contactId,
                    journeyId
                }
            };
        } else {
            body = {
                query: `mutation ExitContactFromJourney($id: String!, $journeyId: String!) { exitContactFromJourney(id: $id, journeyId: $journeyId) }`,
                variables: {
                    id: contactId,
                    journeyId
                }
            };
        }
        return await this.makeRequest<boolean>(body);
    }

    // Update contact status
    async updateContactStatus(contactId: string | undefined, status: ContactStatus | undefined): Promise<boolean> {
        const body: unknown = {
            query: `mutation UpdateContactStatus($input: UpdateContactStatusInput!) { updateContactStatus(input: $input) }`,
            variables: {
                input: {
                    id: contactId,
                    status
                }
            }
        };
        return await this.makeRequest<boolean>(body);
    }

    // Generate custom event
    async generateCustomEvent(contactId: string | undefined, customEventId: string | undefined): Promise<boolean> {
        const body: unknown = {
            query: `mutation CreateContactCustomEvent($id: String!, $key: String!) { createContactCustomEvent(id: $id, key: $key) }`,
            variables: {
                id: contactId,
                key: customEventId
            }
        };
        return await this.makeRequest<boolean>(body);
    }

    // Update journey status
    async updateJourneyStatus(action: string | undefined, journeyId: string | undefined): Promise<boolean> {
        let body: unknown = undefined;
        if (action === 'Start') {
            body = {
                query: `mutation StartJourney($id: String!) { startJourney(id: $id) }`,
                variables: {
                    id: journeyId
                }
            };
        } else {
            body = {
                query: `mutation StopJourney($id: String!) { stopJourney(id: $id) }`,
                variables: {
                    id: journeyId
                }
            };
        }
        return await this.makeRequest<boolean>(body);
    }

    // Add suppression filter
    async createSuppressionFilter(emailAddress: string, reason: string | undefined): Promise<CreateSuppressionFilterResponse> {
        const body: unknown = {
            query: `mutation CreateSuppressionFilter($input: CreateSuppressionFilterInput!) {
                createAccountSuppressionFilter(input: $input) {
                id
                localPart
                domain
                reason
                }
            }`,
            variables: {
                input: {
                    domain: emailAddress.split('@')[1],
                    localPart: emailAddress.split('@')[0],
                    reason
                }
            }
        };
        return await this.makeRequest<CreateSuppressionFilterResponse>(body);
    }

    // Create transaction
    async createTransaction(groupName: string | undefined, fromEmail: string, fromName: string | undefined, toEmail: string, ccEmail: unknown[] | undefined, bccEmail: unknown[] | undefined, subject: string, replyToEmail: string | undefined, replyToName: string | undefined, variables: Record<string, unknown> | undefined, templateId: string | undefined, mimeType: string | undefined, content: string | undefined, ignoreSuppressCheck: string): Promise<CreateSuppressionFilterResponse> {
        const vars: { name: string, value: unknown }[] = [];
        for (const prop in variables) {
            if (prop && prop !== '') {
                vars.push({
                    name: prop.replace(/\s/g, '').replace(/[\W_-]+/g, ''),
                    value: variables[prop],
                });
            }
        }


        const recips = [];
        recips.push({
            emailAddress: toEmail,
            type: 'TO',
            variables: vars,
        });
        ccEmail?.forEach((r: any) => {
            recips.push({
                emailAddress: r.email,
                type: 'CC',
                variables: vars,
            });
        });
        bccEmail?.forEach((r: any) => {
            recips.push({
                emailAddress: r.email,
                type: 'BCC',
                variables: vars,
            });
        });
        const body: unknown = {
            query: `mutation createTransaction($input: CreateTransactionInput!) { createTransaction(input: $input) { emailAddress errorCode errorMsg requestId transactionId } }`,
            variables: {
                input: {
                    content: {
                        templateId: templateId ? templateId : null,
                        contentBodies: !templateId
                            ? [
                                {
                                    bodyContent: content?.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}'),
                                    mimeType: mimeType,
                                },
                            ]
                            : null,
                    },
                    groupName: groupName,
                    header: {
                        from: {
                            emailAddress: fromEmail,
                            name: fromName,
                        },
                        replyTo: {
                            emailAddress: replyToEmail ? replyToEmail : '',
                            name: replyToName ? replyToName : '',
                        },
                        subject,
                    },
                    recipients: recips,
                    settings: {
                        ignoreSuppressCheck: ignoreSuppressCheck === 'true' ? true : false,
                    },
                },
            }
        };
        return await this.makeRequest<CreateSuppressionFilterResponse>(body);
    }
    //#endregion

    // #region Utilities
    getWebhookName(): string {
        return `ActivePieces-${Date.now()}`;
    }

    getWebhookEvent(type: string, parameters: any): Array<{ entityType: unknown; eventType: string }> {
        switch (type) {
            case 'contactAdded':
                return [{ entityType: null, eventType: 'CONTACT_ADDED' }];
            case 'campaignSendFinished':
                return [{ entityType: null, eventType: 'CAMPAIGN_SENT' }];
            case 'campaignSendStarted':
                return [{ entityType: null, eventType: 'STARTED_CAMPAIGN_SEND' }];
            case 'contactBounced': {
                let entityType = null;
                if (parameters.entity !== 'BOTH') {
                    entityType = parameters.entity;
                }
                if (parameters.type === 'Any') {
                    return [
                        { entityType, eventType: 'BLOCK' },
                        { entityType, eventType: 'BLOCK_CONTENT' },
                        { entityType, eventType: 'BLOCK_SENDER' },
                        { entityType, eventType: 'HARD' },
                        { entityType, eventType: 'SOFT' },
                        { entityType, eventType: 'SOFT_DNS' },
                        { entityType, eventType: 'SOFT_IP' },
                        { entityType, eventType: 'SOFT_SENDER_AUTH' },
                    ];
                } else {
                    return [{ entityType, eventType: parameters.type }];
                }
            }
            case 'contactClicked': {
                let entityType = null;
                if (parameters.entity !== 'BOTH') {
                    entityType = parameters.entity;
                }
                return [{ entityType, eventType: 'CLICK' }];
            }
            case 'contactReplied': {
                let entityType = null;
                if (parameters.entity !== 'BOTH') {
                    entityType = parameters.entity;
                }
                return [{ entityType, eventType: 'REPLIED' }];
            }
            case 'contactGroupUpdated':
                return [{
                    entityType: null,
                    eventType:
                        parameters.action === 'Add' ? 'GROUP_ADDED' : 'GROUP_REMOVED',
                }];
            case 'contactNoteAdded':
                return [{ entityType: null, eventType: 'NOTE_ADDED' }];
            case 'contactOpened': {
                let entityType = null;
                if (parameters.entity !== 'BOTH') {
                    entityType = parameters.entity;
                }
                return [{ entityType, eventType: 'OPEN' }];
            }
            case 'contactStatusUpdated': {
                if (parameters.status === 'Any') {
                    return [
                        { entityType: null, eventType: 'SUBSCRIBED' },
                        { entityType: null, eventType: 'UNSUBSCRIBED' },
                    ];
                } else if (parameters.status === 'ACTIVE') {
                    return [
                        { entityType: null, eventType: 'SUBSCRIBED' }
                    ];
                } else {
                    return [
                        { entityType: null, eventType: 'UNSUBSCRIBED' },
                    ];
                }
            }
            case 'contactTagUpdated': {
                return [{
                    entityType: null,
                    eventType: parameters.action === 'Add' ? 'TAG_ADDED' : 'TAG_REMOVED',
                }];
            }
            case 'contactUnsubscribed':
                return [{ entityType: null, eventType: 'UNSUBSCRIBED' }];
            case 'contactUpdated':
                return [{ entityType: null, eventType: 'FIELD_UPDATED' }];
            case 'formSubmitted':
                return [
                    { entityType: 'FORM', eventType: 'SUBMITTED_COMPLETE_FORM' },
                    { entityType: 'FORM', eventType: 'SUBMITTED_PARTIAL_FORM' },
                ];
            case 'landingPageCtaPerformed':
                return [{ entityType: 'PAGE', eventType: 'CTA' }];
            case 'surveySubmitted':
                return [
                    { entityType: 'SURVEY', eventType: 'SUBMITTED_COMPLETE_FORM' },
                    { entityType: 'SURVEY', eventType: 'SUBMITTED_PARTIAL_FORM' },
                ];
            case 'transactionCreated':
                return [{ entityType: null, eventType: 'CREATED' }];
            case 'transactionSent':
                return [{ entityType: null, eventType: 'PROCESSED' }];
            default: return [];
        }
    }

    generateWebhookInput(type: string, parameters: any): any {
        const conditions = [];
        if (parameters.audienceId) {
            conditions.push({
                dataFieldId: null,
                fieldName: 'audience',
                operator: 'IF_TRUE',
                value: parameters.audienceId,
            });
        }
        if (parameters.groupId) {
            conditions.push({
                dataFieldId: null,
                fieldName: 'groups',
                operator: 'CONTAINS',
                value: parameters.groupId,
            });
        }
        if (parameters.tagId) {
            conditions.push({
                dataFieldId: null,
                fieldName: 'tags',
                operator: 'CONTAINS',
                value: parameters.tagId,
            });
        }

        if (type === 'contactClicked' || type === 'contactOpened') {
            let campaignString = '';
            let value = null;
            if (parameters.campaignType === 'Any') {
                campaignString = `Campaign.AnyLast5.${type === 'contactClicked' ? 'Clicked' : 'Opened'
                    }`;
            }
            if (parameters.campaignType === 'All') {
                campaignString = `Campaign.AllLast5.${type === 'contactClicked' ? 'Clicked' : 'Opened'
                    }`;
            }
            if (parameters.campaignType === 'AnyX') {
                campaignString = `Campaign.AnyWithinLast.${type === 'contactClicked' ? 'Clicked' : 'Opened'
                    }`;
                value = `${parameters.campaignScope.campaignRange}${parameters.campaignScope.campaignPeriod}`;
            }
            if (parameters.campaignType === 'Specific') {
                campaignString = `Campaign.${parameters.campaignScope.campaignId}.${type === 'contactClicked' ? 'Clicked' : 'Opened'
                    }${type === 'contactClicked' && parameters.campaignScope.linkId
                        ? '.' + parameters.campaignScope.linkId
                        : ''
                    }`;
            }

            conditions.push({
                dataFieldId: null,
                fieldName: campaignString,
                operator: 'IF_TRUE',
                value,
            });
        }

        if (type === 'contactStatusUpdated' && parameters.status !== 'Any') {
            conditions.push({
                dataFieldId: null,
                fieldName: 'Status',
                operator: 'EQUAL',
                value: parameters.status,
            });
        }

        if (type === 'formSubmitted' && parameters.formId) {
            conditions.push({
                dataFieldId: null,
                fieldName: `Form.${parameters.formId}.Submitted`,
                operator: 'IF_TRUE',
                value: null,
            });
        }

        if (type === 'landingPageCtaPerformed' && parameters.pageId) {
            conditions.push({
                dataFieldId: null,
                fieldName: `Page.${parameters.pageId}.CTA`,
                operator: 'IF_TRUE',
                value: null,
            });
        }

        if (type === 'surveySubmitted' && parameters.surveyId) {
            conditions.push({
                dataFieldId: null,
                fieldName: `Survey.${parameters.surveyId}.Submitted`,
                operator: 'IF_TRUE',
                value: null,
            });
        }

        return conditions.length !== 0
            ? {
                operator: 'AND',
                conditions,
                conditionGroups: [],
            }
            : null;
    }

    getHelpText(fieldName: string, dataType: string, defaultValue: string, isGdpr = false): string {
        switch (dataType) {
            case 'BIRTHDAY': {
                return `This will set the value for the ${fieldName} data field.`;
            }
            case 'DATE': {
                return `This will set the value for the ${fieldName} data field.`;
            }
            case 'DATE_TIME': {
                return `This will set the value for the ${fieldName} data field.`;
            }
            case 'NUMBER': {
                if (isGdpr) {
                    return `Enter 1 to allow and 0 to not allow. This will set the value for the ${fieldName}* GDPR permission.`;
                } else {
                    return `This will set the value for the ${fieldName} data field. Must contain only numbers. (255 character limit)`;
                }
            }
            case 'ZIP_CODE': {
                return `U.S. Only. This will set the value for the ${fieldName} data field. Format: ##### or #####-####  (10 character limit)`;
            }
            case 'PHONE': {
                return `This will set the value for the ${fieldName} data field.`;
            }
            case 'COUNTRY':
            case 'EMAIL':
            case 'IMAGE':
            case 'INT_PHONE':
            case 'STATE':
            case 'TEXT':
            case 'URL': {
                return `This will set the value for the ${fieldName} data field.${defaultValue ? ' Default value: ' + defaultValue : ''
                    } (255 character limit)`;
            }
            default: return '';
        }
    };

    isISODate(str: string): boolean {
        const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;
        return isoFormat.test(str) && !isNaN(Date.parse(str));
    }

    formatISODateToYMD(isoString: string): string {
        console.log(isoString);
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Months are zero-based
        const day = date.getDate();

        return `${year}/${month}/${day}`;
    }
    //#endregion
}
