import { describe, expect, it } from 'vitest'

import { curatedN8nWorkflowTemplateService } from '../../../../src/app/template/curated-n8n-workflow-templates'

describe('curatedN8nWorkflowTemplateService', () => {
    it('returns the curated n8n workflow templates', () => {
        const templates = curatedN8nWorkflowTemplateService.list({})

        expect(templates).toHaveLength(10)
        expect(templates.map((template) => template.id)).toEqual([
            'n8n-typeform-hubspot-slack-leads',
            'n8n-gmail-drive-sheets-attachments',
            'n8n-slack-github-request-to-issue',
            'n8n-rss-telegram-digest',
            'n8n-stripe-failed-payment-slack-gmail',
            'n8n-gmail-notion-task',
            'n8n-airtable-discord-record-alert',
            'n8n-google-calendar-slack-agenda',
            'n8n-shopify-google-sheets-orders',
            'n8n-zendesk-microsoft-teams-escalation',
        ])
    })

    it('finds a curated template by id', () => {
        const template = curatedN8nWorkflowTemplateService.get({
            id: 'n8n-stripe-failed-payment-slack-gmail',
        })

        expect(template?.name).toBe('Alert on Failed Stripe Payments')
        expect(template?.pieces).toContain('@activepieces/piece-stripe')
    })

    it('connects RSS digest templates to Telegram notifications', () => {
        const template = curatedN8nWorkflowTemplateService.get({
            id: 'n8n-rss-telegram-digest',
        })

        const telegramAction = template?.flows?.[0]?.trigger.nextAction?.nextAction

        expect(telegramAction?.displayName).toBe('Send Telegram Digest')
        expect(telegramAction?.settings.pieceName).toBe('@activepieces/piece-telegram-bot')
        expect(telegramAction?.settings.actionName).toBe('send_text_message')
    })

    it('connects calendar agenda templates to Slack notifications', () => {
        const template = curatedN8nWorkflowTemplateService.get({
            id: 'n8n-google-calendar-slack-agenda',
        })

        const calendarAction = template?.flows?.[0]?.trigger.nextAction
        const slackAction = calendarAction?.nextAction

        expect(calendarAction?.settings.actionName).toBe('google_calendar_get_events')
        expect(slackAction?.displayName).toBe('Send Slack Agenda')
        expect(slackAction?.settings.pieceName).toBe('@activepieces/piece-slack')
        expect(slackAction?.settings.actionName).toBe('send_channel_message')
    })

    it('filters curated templates by search text', () => {
        const templates = curatedN8nWorkflowTemplateService.list({
            search: 'zendesk',
        })

        expect(templates).toHaveLength(1)
        expect(templates[0].id).toBe('n8n-zendesk-microsoft-teams-escalation')
    })

    it('filters curated templates by category', () => {
        const templates = curatedN8nWorkflowTemplateService.list({
            categories: ['Finance'],
        })

        expect(templates.map((template) => template.id).sort()).toEqual([
            'n8n-shopify-google-sheets-orders',
            'n8n-stripe-failed-payment-slack-gmail',
        ])
    })

    it('filters curated templates by pieces', () => {
        const templates = curatedN8nWorkflowTemplateService.list({
            pieces: ['@activepieces/piece-gmail', '@activepieces/piece-notion'],
        })

        expect(templates).toHaveLength(1)
        expect(templates[0].id).toBe('n8n-gmail-notion-task')
    })

    it('keeps curated template names distinct from existing official templates', () => {
        const names = curatedN8nWorkflowTemplateService
            .list({})
            .map((template) => template.name)

        expect(names).not.toContain('Create GitLab Issues From Linear')
        expect(names).not.toContain('List invoices in Excel')
        expect(names).not.toContain('Send Slack Alerts for Emails')
    })
})
