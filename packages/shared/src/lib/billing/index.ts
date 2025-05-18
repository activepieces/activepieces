import dayjs from 'dayjs'

export enum UsageMetric {
    TASKS = 'tasks',
    AI_CREDIT = 'aiCredit',
    TABLES = 'tables',
    MCP_SERVERS = 'mcpServers',
    ACTIVE_FLOWS = 'activeFlows',
}

export enum UsageEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

export function getCurrentBillingPeriodStart(): string {
    return dayjs().startOf('month').toISOString()
}

export function getCurrentBillingPeriodEnd(): string {
    return dayjs().endOf('month').toISOString()
}