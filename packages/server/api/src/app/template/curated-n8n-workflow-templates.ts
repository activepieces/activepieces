import { FlowActionType, FlowTriggerType, PropertyExecutionType, Template, TemplateStatus, TemplateType } from '@activepieces/shared'

const CREATED_AT = '2026-06-22T00:00:00.000Z'
const ACTIVEPIECES_TEAM = 'Activepieces Team'
const N8N_SOURCE_REPO = 'https://github.com/Zie619/n8n-workflows'

function createPieceAction({
    name,
    displayName,
    pieceName,
    actionName,
    input,
    nextAction,
}: CreatePieceActionParams): TemplateAction {
    return {
        name,
        skip: false,
        type: FlowActionType.PIECE,
        valid: true,
        settings: {
            input,
            pieceName,
            actionName,
            sampleData: {},
            pieceVersion: '~0.0.1',
            propertySettings: {},
            errorHandlingOptions: {
                retryOnFailure: {
                    value: false,
                },
                continueOnFailure: {
                    value: false,
                },
            },
        },
        nextAction,
        displayName,
        lastUpdatedDate: CREATED_AT,
    }
}

function createPieceTrigger({
    displayName,
    pieceName,
    triggerName,
    input,
    nextAction,
}: CreatePieceTriggerParams): TemplateTrigger {
    return {
        name: 'trigger',
        type: FlowTriggerType.PIECE,
        valid: true,
        settings: {
            input,
            pieceName,
            sampleData: {},
            triggerName,
            pieceVersion: '~0.0.1',
            propertySettings: {},
        },
        nextAction,
        displayName,
        lastUpdatedDate: CREATED_AT,
    }
}

function createScheduleTrigger({
    displayName,
    nextAction,
}: CreateScheduleTriggerParams): TemplateTrigger {
    return {
        name: 'trigger',
        type: FlowTriggerType.PIECE,
        valid: true,
        settings: {
            input: {
                cronExpression: '0 9 * * *',
                timezone: 'UTC',
            },
            pieceName: '@activepieces/piece-schedule',
            sampleData: {},
            triggerName: 'cron_expression',
            pieceVersion: '~0.0.1',
            propertySettings: {},
        },
        nextAction,
        displayName,
        lastUpdatedDate: CREATED_AT,
    }
}

function createTemplate({
    id,
    name,
    summary,
    description,
    categories,
    pieces,
    tags,
    sourceWorkflow,
    trigger,
}: CreateTemplateParams): Template {
    return {
        id,
        created: CREATED_AT,
        updated: CREATED_AT,
        name,
        summary,
        description: `${description}\n\nSource inspiration: ${sourceWorkflow} from ${N8N_SOURCE_REPO}.`,
        type: TemplateType.OFFICIAL,
        platformId: null,
        status: TemplateStatus.PUBLISHED,
        flows: [
            {
                notes: [],
                valid: true,
                trigger,
                displayName: name,
                schemaVersion: '16',
            },
        ],
        tags,
        blogUrl: N8N_SOURCE_REPO,
        metadata: {
            source: 'n8n-workflows',
            sourceRepo: N8N_SOURCE_REPO,
            sourceWorkflow,
        },
        author: ACTIVEPIECES_TEAM,
        categories,
        pieces,
    }
}

function matchesSearch({ template, search }: MatchesSearchParams): boolean {
    if (!search) {
        return true
    }
    const normalizedSearch = search.toLowerCase()
    return [
        template.name,
        template.summary,
        template.description,
        ...template.categories,
        ...template.pieces,
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
}

function matchesCategories({
    template,
    categories,
}: MatchesCategoriesParams): boolean {
    if (!categories || categories.length === 0) {
        return true
    }
    return categories.some((category) => template.categories.includes(category))
}

function matchesPieces({ template, pieces }: MatchesPiecesParams): boolean {
    if (!pieces || pieces.length === 0) {
        return true
    }
    return pieces.every((piece) => template.pieces.includes(piece))
}

function filterCuratedN8nWorkflowTemplates({
    search,
    categories,
    pieces,
}: FilterCuratedN8nWorkflowTemplatesParams): Template[] {
    return curatedN8nWorkflowTemplates.filter(
        (template) =>
            matchesSearch({
                template,
                search,
            }) &&
      matchesCategories({
          template,
          categories,
      }) &&
      matchesPieces({
          template,
          pieces,
      }),
    )
}

const captureTypeformLeadsAction = createPieceAction({
    name: 'step_1',
    displayName: 'Create or Update HubSpot Contact',
    pieceName: '@activepieces/piece-hubspot',
    actionName: 'create_contact',
    input: {
        auth: '{{connections[\'hubspot\']}}',
        email: '{{trigger[\'email\']}}',
        firstName: '{{trigger[\'firstName\']}}',
        lastName: '{{trigger[\'lastName\']}}',
    },
    nextAction: createPieceAction({
        name: 'step_2',
        displayName: 'Notify Sales Channel',
        pieceName: '@activepieces/piece-slack',
        actionName: 'send_channel_message',
        input: {
            auth: '{{connections[\'slack\']}}',
            text: 'New Typeform lead: {{trigger[\'email\']}}',
        },
    }),
})

const saveGmailAttachmentsAction = createPieceAction({
    name: 'step_1',
    displayName: 'Upload Attachment to Drive',
    pieceName: '@activepieces/piece-google-drive',
    actionName: 'upload_file',
    input: {
        auth: '{{connections[\'google-drive\']}}',
        file: '{{trigger[\'attachments\'][0]}}',
    },
    nextAction: createPieceAction({
        name: 'step_2',
        displayName: 'Log Email in Sheet',
        pieceName: '@activepieces/piece-google-sheets',
        actionName: 'insert_row',
        input: {
            auth: '{{connections[\'google-sheets\']}}',
            values: {
                from: '{{trigger[\'from\']}}',
                subject: '{{trigger[\'subject\']}}',
            },
        },
    }),
})

const curatedN8nWorkflowTemplates = [
    createTemplate({
        id: 'n8n-typeform-hubspot-slack-leads',
        name: 'Capture Typeform Leads in HubSpot and Slack',
        summary:
      'Create a HubSpot contact from each Typeform submission and alert the sales team in Slack.',
        description:
      'Useful because high-intent form submissions need fast sales follow-up. This template prevents leads from sitting in form tools and gives the team immediate visibility.',
        categories: ['Sales', 'Marketing'],
        pieces: [
            '@activepieces/piece-typeform',
            '@activepieces/piece-hubspot',
            '@activepieces/piece-slack',
        ],
        tags: [
            { color: '#e4fded', title: 'Lead response' },
            { color: '#dbeaff', title: 'CRM sync' },
        ],
        sourceWorkflow: 'workflows/Manual/0117_Manual_Uplead_Import_Triggered.json',
        trigger: createPieceTrigger({
            displayName: 'New Typeform Submission',
            pieceName: '@activepieces/piece-typeform',
            triggerName: 'new_submission',
            input: { auth: '{{connections[\'typeform\']}}' },
            nextAction: captureTypeformLeadsAction,
        }),
    }),
    createTemplate({
        id: 'n8n-gmail-drive-sheets-attachments',
        name: 'Save Gmail Attachments to Google Drive and Sheets',
        summary:
      'Archive new Gmail attachments in Google Drive and log the sender and subject in Google Sheets.',
        description:
      'Useful because finance, operations, and support teams often receive important files by email. This gives them a searchable archive and a lightweight audit trail.',
        categories: ['Productivity', 'Operations'],
        pieces: [
            '@activepieces/piece-gmail',
            '@activepieces/piece-google-drive',
            '@activepieces/piece-google-sheets',
        ],
        tags: [
            { color: '#fff4db', title: 'Document archive' },
            { color: '#dbeaff', title: 'Audit trail' },
        ],
        sourceWorkflow: 'workflows/Emailreadimap/1050_Emailreadimap_Send.json',
        trigger: createPieceTrigger({
            displayName: 'New Gmail Email',
            pieceName: '@activepieces/piece-gmail',
            triggerName: 'new_email',
            input: { auth: '{{connections[\'gmail\']}}' },
            nextAction: saveGmailAttachmentsAction,
        }),
    }),
    createTemplate({
        id: 'n8n-slack-github-request-to-issue',
        name: 'Create GitHub Issues From Slack Requests',
        summary:
      'Turn a Slack request message into a GitHub issue for engineering triage.',
        description:
      'Useful because support and product requests often start in chat. Converting them into GitHub issues keeps engineering work traceable and prioritized.',
        categories: ['Engineering', 'Support'],
        pieces: ['@activepieces/piece-slack', '@activepieces/piece-github'],
        tags: [
            { color: '#e4fded', title: 'Triage' },
            { color: '#dbeaff', title: 'Issue tracking' },
        ],
        sourceWorkflow: 'workflows/Webhook/0644_Webhook_Slack_Create_Webhook.json',
        trigger: createPieceTrigger({
            displayName: 'New Slack Message',
            pieceName: '@activepieces/piece-slack',
            triggerName: 'new_message',
            input: { auth: '{{connections[\'slack\']}}' },
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Create GitHub Issue',
                pieceName: '@activepieces/piece-github',
                actionName: 'create_issue',
                input: {
                    auth: '{{connections[\'github\']}}',
                    title: '{{trigger[\'text\']}}',
                    body: 'Created from Slack message {{trigger[\'permalink\']}}',
                },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-rss-telegram-digest',
        name: 'Send RSS Digest to Telegram',
        summary:
      'Check an RSS feed on a schedule and send fresh posts to a Telegram chat.',
        description:
      'Useful because teams can monitor news, changelogs, competitors, or incident feeds without manually checking multiple websites.',
        categories: ['Marketing', 'Monitoring'],
        pieces: [
            '@activepieces/piece-schedule',
            '@activepieces/piece-rss',
            '@activepieces/piece-telegram-bot',
        ],
        tags: [
            { color: '#fff4db', title: 'Digest' },
            { color: '#dbeaff', title: 'Monitoring' },
        ],
        sourceWorkflow:
      'workflows/Rssfeedread/0188_Rssfeedread_Telegram_Create_Scheduled.json',
        trigger: createScheduleTrigger({
            displayName: 'Every Morning',
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Read RSS Feed',
                pieceName: '@activepieces/piece-rss',
                actionName: 'read_rss_feed',
                input: { url: 'https://example.com/feed.xml' },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-stripe-failed-payment-slack-gmail',
        name: 'Alert on Failed Stripe Payments',
        summary:
      'Notify Slack and email the billing team when Stripe reports a failed payment.',
        description:
      'Useful because failed payments are revenue leaks. A fast notification gives billing or customer success a chance to recover the account quickly.',
        categories: ['Sales', 'Finance'],
        pieces: [
            '@activepieces/piece-stripe',
            '@activepieces/piece-slack',
            '@activepieces/piece-gmail',
        ],
        tags: [
            { color: '#ffe0e0', title: 'Revenue recovery' },
            { color: '#dbeaff', title: 'Billing alert' },
        ],
        sourceWorkflow: 'workflows/Http/1773_HTTP_Stripe_Sync_Webhook.json',
        trigger: createPieceTrigger({
            displayName: 'Stripe Payment Failed',
            pieceName: '@activepieces/piece-stripe',
            triggerName: 'payment_failed',
            input: { auth: '{{connections[\'stripe\']}}' },
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Send Slack Alert',
                pieceName: '@activepieces/piece-slack',
                actionName: 'send_channel_message',
                input: {
                    auth: '{{connections[\'slack\']}}',
                    text: 'Stripe payment failed for {{trigger[\'customer_email\']}}',
                },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-gmail-notion-task',
        name: 'Create Notion Tasks From Important Gmail',
        summary:
      'Create a Notion task whenever an important Gmail message arrives.',
        description:
      'Useful because important emails become actionable tasks instead of getting buried in an inbox.',
        categories: ['Productivity', 'Operations'],
        pieces: ['@activepieces/piece-gmail', '@activepieces/piece-notion'],
        tags: [
            { color: '#e4fded', title: 'Inbox to task' },
            { color: '#dbeaff', title: 'Task tracking' },
        ],
        sourceWorkflow:
      'workflows/Stickynote/0378_Stickynote_Notion_Automate_Webhook.json',
        trigger: createPieceTrigger({
            displayName: 'Important Gmail Email',
            pieceName: '@activepieces/piece-gmail',
            triggerName: 'new_email',
            input: { auth: '{{connections[\'gmail\']}}', label: 'IMPORTANT' },
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Create Notion Page',
                pieceName: '@activepieces/piece-notion',
                actionName: 'create_database_item',
                input: {
                    auth: '{{connections[\'notion\']}}',
                    title: '{{trigger[\'subject\']}}',
                    content: '{{trigger[\'body\']}}',
                },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-airtable-discord-record-alert',
        name: 'Notify Discord When Airtable Records Change',
        summary: 'Watch Airtable records and post updates into a Discord channel.',
        description:
      'Useful because community, content, and operations teams can react to database updates without constantly checking Airtable.',
        categories: ['Operations', 'Community'],
        pieces: ['@activepieces/piece-airtable', '@activepieces/piece-discord'],
        tags: [
            { color: '#fff4db', title: 'Database alert' },
            { color: '#dbeaff', title: 'Community ops' },
        ],
        sourceWorkflow:
      'workflows/Discord/0360_Discord_Cron_Automation_Scheduled.json',
        trigger: createPieceTrigger({
            displayName: 'New Airtable Record',
            pieceName: '@activepieces/piece-airtable',
            triggerName: 'new_record',
            input: { auth: '{{connections[\'airtable\']}}' },
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Send Discord Message',
                pieceName: '@activepieces/piece-discord',
                actionName: 'send_message',
                input: {
                    auth: '{{connections[\'discord\']}}',
                    content: 'Airtable record changed: {{trigger[\'id\']}}',
                },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-google-calendar-slack-agenda',
        name: 'Send Daily Google Calendar Agenda to Slack',
        summary: 'Send the day’s Google Calendar agenda to Slack every morning.',
        description:
      'Useful because teams get meeting context before the day starts, reducing missed meetings and last-minute context switching.',
        categories: ['Productivity', 'Operations'],
        pieces: [
            '@activepieces/piece-schedule',
            '@activepieces/piece-google-calendar',
            '@activepieces/piece-slack',
        ],
        tags: [
            { color: '#e4fded', title: 'Daily briefing' },
            { color: '#dbeaff', title: 'Calendar' },
        ],
        sourceWorkflow:
      'workflows/Googlecalendar/0783_GoogleCalendar_Schedule_Create_Scheduled.json',
        trigger: createScheduleTrigger({
            displayName: 'Every Weekday Morning',
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Get Calendar Events',
                pieceName: '@activepieces/piece-google-calendar',
                actionName: 'get_events',
                input: { auth: '{{connections[\'google-calendar\']}}' },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-shopify-google-sheets-orders',
        name: 'Log Shopify Paid Orders in Google Sheets',
        summary: 'Append each paid Shopify order to a Google Sheet for reporting.',
        description:
      'Useful because many small teams still use spreadsheets for finance, fulfillment, or daily sales reporting.',
        categories: ['Ecommerce', 'Finance'],
        pieces: [
            '@activepieces/piece-shopify',
            '@activepieces/piece-google-sheets',
        ],
        tags: [
            { color: '#e4fded', title: 'Order reporting' },
            { color: '#dbeaff', title: 'Spreadsheet sync' },
        ],
        sourceWorkflow:
      'workflows/Shopify/0961_Shopify_Filter_Create_Triggered.json',
        trigger: createPieceTrigger({
            displayName: 'Paid Shopify Order',
            pieceName: '@activepieces/piece-shopify',
            triggerName: 'new_paid_order',
            input: { auth: '{{connections[\'shopify\']}}' },
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Append Order Row',
                pieceName: '@activepieces/piece-google-sheets',
                actionName: 'insert_row',
                input: {
                    auth: '{{connections[\'google-sheets\']}}',
                    values: {
                        orderId: '{{trigger[\'id\']}}',
                        total: '{{trigger[\'total_price\']}}',
                    },
                },
            }),
        }),
    }),
    createTemplate({
        id: 'n8n-zendesk-microsoft-teams-escalation',
        name: 'Escalate Zendesk Tickets to Microsoft Teams',
        summary:
      'Post high-priority Zendesk tickets to Microsoft Teams for rapid escalation.',
        description:
      'Useful because urgent customer issues should leave the ticket queue and reach the people who can unblock them quickly.',
        categories: ['Support', 'Operations'],
        pieces: [
            '@activepieces/piece-zendesk',
            '@activepieces/piece-microsoft-teams',
        ],
        tags: [
            { color: '#ffe0e0', title: 'Escalation' },
            { color: '#dbeaff', title: 'Support ops' },
        ],
        sourceWorkflow:
      'workflows/Shopify/0268_Shopify_Zendesk_Create_Triggered.json',
        trigger: createPieceTrigger({
            displayName: 'New Zendesk Ticket',
            pieceName: '@activepieces/piece-zendesk',
            triggerName: 'new_ticket',
            input: { auth: '{{connections[\'zendesk\']}}' },
            nextAction: createPieceAction({
                name: 'step_1',
                displayName: 'Post Teams Message',
                pieceName: '@activepieces/piece-microsoft-teams',
                actionName: 'send_channel_message',
                input: {
                    auth: '{{connections[\'microsoft-teams\']}}',
                    message: 'Urgent Zendesk ticket: {{trigger[\'subject\']}}',
                },
            }),
        }),
    }),
]

const curatedN8nWorkflowTemplateCategories = Array.from(
    new Set(
        curatedN8nWorkflowTemplates.flatMap((template) => template.categories),
    ),
).sort()

export const curatedN8nWorkflowTemplateService = {
    get({ id }: { id: string }): Template | undefined {
        return curatedN8nWorkflowTemplates.find((template) => template.id === id)
    },
    list: filterCuratedN8nWorkflowTemplates,
    categories: curatedN8nWorkflowTemplateCategories,
}

type CreatePieceActionParams = {
    name: string
    displayName: string
    pieceName: string
    actionName: string
    input: Record<string, unknown>
    nextAction?: TemplateAction
}

type CreatePieceTriggerParams = {
    displayName: string
    pieceName: string
    triggerName: string
    input: Record<string, unknown>
    nextAction: TemplateAction
}

type CreateScheduleTriggerParams = {
    displayName: string
    nextAction: TemplateAction
}

type CreateTemplateParams = {
    id: string
    name: string
    summary: string
    description: string
    categories: string[]
    pieces: string[]
    tags: {
        color: string
        title: string
    }[]
    sourceWorkflow: string
    trigger:
    | ReturnType<typeof createPieceTrigger>
    | ReturnType<typeof createScheduleTrigger>
}

type MatchesSearchParams = {
    template: Template
    search?: string
}

type MatchesCategoriesParams = {
    template: Template
    categories?: string[]
}

type MatchesPiecesParams = {
    template: Template
    pieces?: string[]
}

type FilterCuratedN8nWorkflowTemplatesParams = {
    search?: string
    categories?: string[]
    pieces?: string[]
}

type TemplateAction = {
    name: string
    skip: boolean
    type: FlowActionType.PIECE
    valid: boolean
    settings: {
        input: Record<string, unknown>
        pieceName: string
        actionName: string
        sampleData: Record<string, unknown>
        pieceVersion: string
        propertySettings: Record<string, TemplatePropertySetting>
        errorHandlingOptions: {
            retryOnFailure: {
                value: boolean
            }
            continueOnFailure: {
                value: boolean
            }
        }
    }
    nextAction?: TemplateAction
    displayName: string
    lastUpdatedDate: string
}


type TemplateTrigger = {
    name: string
    type: FlowTriggerType.PIECE
    valid: boolean
    settings: {
        input: Record<string, unknown>
        pieceName: string
        sampleData: Record<string, unknown>
        triggerName: string
        pieceVersion: string
        propertySettings: Record<string, TemplatePropertySetting>
    }
    nextAction: TemplateAction
    displayName: string
    lastUpdatedDate: string
}


type TemplatePropertySetting = {
    type: PropertyExecutionType
    schema?: unknown
}
