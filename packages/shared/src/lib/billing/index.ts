import dayjs from 'dayjs'

export enum BillingMetric {
    TASKS = 'tasks',
    AI_TOKENS = 'aiTokens',
    TABLES = 'tables',
    MCP_SERVERS = 'mcpServers',
    ACTIVE_FLOWS = 'activeFlows',
}

export enum BillingEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

export function getCurrentBillingPeriodStart(): string {
    return dayjs().startOf('month').toISOString()
}

export function getCurrentBillingPeriodEnd(): string {
    return dayjs().endOf('month').toISOString()
}