import { ActivepiecesError, ErrorCode, isNil, tryCatch, unique } from '@activepieces/core-utils'
import { AgentConversationStatus, AgentRunSource, SendAgentEmailRequest, SendAgentEmailResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentApprovalGate } from '.././agent-approval-gate'
import { agentHelpers } from '.././agent-helpers'
import { userService } from '../../../user/user-service'
import { smtpEmailSender } from '../../helper/email/email-sender/smtp-email-sender'
import { emailService } from '../../helper/email/email-service'

export const emailRpc = (log: FastifyBaseLogger) => ({
    // Security boundary for the chat agent's ap_send_email tool. Recipients may be any valid
    // address (incl. external), but the abuse controls are re-enforced here so a manipulated LLM
    // (e.g. via prompt injection) can't quietly fan out mail on the platform's SMTP reputation:
    // recipient addresses are format-validated, recipient count and per-platform/per-conversation/
    // per-hour volume are capped, and the email is rendered through a branded template with
    // Reply-To set to the real user. The system prompt further constrains the agent to send only
    // on the user's direct request — never because an email instruction appeared in fetched page
    // or tool content.
    async sendAgentEmail(input: SendAgentEmailRequest): Promise<SendAgentEmailResponse> {
        const { conversationId, platformId, userId, to, subject, body } = input

        if (!smtpEmailSender(log).isSmtpConfigured()) {
            return { sent: false, message: 'Email is not configured on this instance.' }
        }

        const conversation = await agentHelpers.getConversationOrThrow({ id: conversationId, platformId, userId })

        if (conversation.source !== AgentRunSource.CHAT) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Only a chat run can send email' } })
        }

        // Fence the send to the active streaming owner. A run parked on an email approval must not
        // resume and send once it's been superseded (activeRunId changed) OR cancelled/finished
        // (status left STREAMING). Cancellation flips status to IDLE without touching activeRunId,
        // so the status check is what rejects an approved-then-cancelled send.
        const ownsActiveTurn = conversation.status === AgentConversationStatus.STREAMING
            && (isNil(conversation.activeRunId) || conversation.activeRunId === input.runId)
        if (!isNil(input.runId) && !ownsActiveTurn) {
            log.warn({ conversation: { id: conversationId }, run: { id: input.runId }, status: conversation.status }, '[agentRpc#sendAgentEmail] Blocked send from a superseded or cancelled run')
            return { sent: false, message: 'This turn is no longer active, so the email was not sent.' }
        }

        const recipients = unique(to.map((email) => email.toLowerCase().trim()).filter((email) => email.length > 0))
        if (recipients.length === 0) {
            return { sent: false, message: 'No valid recipient email address was provided.' }
        }
        if (recipients.length > MAX_EMAIL_RECIPIENTS) {
            return { sent: false, message: `You can send to at most ${MAX_EMAIL_RECIPIENTS} recipients at once.` }
        }
        const invalidRecipients = recipients.filter((email) => !isLikelyEmailAddress(email))
        if (invalidRecipients.length > 0) {
            return {
                sent: false,
                message: `These are not valid email addresses: ${invalidRecipients.join(', ')}. Provide a real address (e.g. the person's email, or the user's own address for "email me").`,
                blockedRecipients: invalidRecipients,
            }
        }
        if (subject.trim().length === 0) {
            return { sent: false, message: 'The email subject cannot be empty.' }
        }
        if (subject.length > MAX_EMAIL_SUBJECT_LENGTH || body.length > MAX_EMAIL_BODY_LENGTH) {
            return { sent: false, message: 'The email subject or body is too long.' }
        }

        const sender = await userService(log).getMetaInformation({ id: userId })
        const selfEmail = sender.email.toLowerCase().trim()

        // Defense in depth at the SMTP boundary: a recipient other than the user's own address may
        // only be emailed after the user approved this exact tool call. The worker shows an approval
        // card and waits, but the server independently verifies the recorded (user-authenticated)
        // decision, so a prompt-injected or buggy caller can't exfiltrate externally without it.
        const externalRecipients = recipients.filter((email) => email !== selfEmail)
        if (externalRecipients.length > 0) {
            const decision = isNil(input.gateId) ? 'pending' : await agentApprovalGate.checkDecision({ gateId: input.gateId })
            const approved = decision !== 'pending' && decision.approved
                && emailApprovalMatches({ approvedInput: decision.approvedInput, recipients, subject, body })
            if (!approved) {
                log.warn({ conversation: { id: conversationId }, user: { id: userId }, recipientCount: externalRecipients.length }, '[agentRpc#sendAgentEmail] Blocked external send without an approval matching the current recipients/content')
                return { sent: false, message: 'Sending to anyone other than your own address needs your explicit approval first.', blockedRecipients: externalRecipients }
            }
        }

        const conversationLimit = await agentHelpers.incrementAndCheckLimit({ key: `chat-email-count:conv:${platformId}:${conversationId}`, limit: EMAILS_PER_CONVERSATION, ttlSeconds: CONVERSATION_LIMIT_TTL_SECONDS })
        const hourlyLimit = await agentHelpers.incrementAndCheckLimit({ key: `chat-email-count:user:${platformId}:${userId}`, limit: EMAILS_PER_USER_PER_HOUR, ttlSeconds: HOURLY_LIMIT_TTL_SECONDS })
        if (!conversationLimit.allowed || !hourlyLimit.allowed) {
            log.warn({ conversation: { id: conversationId }, user: { id: userId }, conversationCount: conversationLimit.count, hourlyCount: hourlyLimit.count }, '[agentRpc#sendAgentEmail] Email rate limit reached')
            return { sent: false, message: 'You have reached the email sending limit for now. Please try again later.' }
        }

        const senderName = [sender.firstName, sender.lastName].filter((part) => !isNil(part) && part.length > 0).join(' ').trim() || selfEmail

        const { error } = await tryCatch(() => emailService(log).sendChatNotification({
            platformId,
            to: recipients,
            subject,
            body,
            senderName,
            senderEmail: sender.email,
        }))
        if (error) {
            log.error({ error, conversation: { id: conversationId }, user: { id: userId } }, '[agentRpc#sendAgentEmail] Email send failed')
            return { sent: false, message: 'The email could not be sent due to a server error.' }
        }

        log.info({ conversation: { id: conversationId }, user: { id: userId }, recipientCount: recipients.length, subject }, '[agentRpc#sendAgentEmail] Chat notification email sent')
        return { sent: true, message: `Email sent to ${recipients.join(', ')}.` }
    },
})


const MAX_EMAIL_RECIPIENTS = 10
const MAX_EMAIL_SUBJECT_LENGTH = 300
const MAX_EMAIL_BODY_LENGTH = 10_000
const EMAILS_PER_CONVERSATION = 20
const EMAILS_PER_USER_PER_HOUR = 30
const CONVERSATION_LIMIT_TTL_SECONDS = 24 * 60 * 60
const HOURLY_LIMIT_TTL_SECONDS = 60 * 60
function isLikelyEmailAddress(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// The approval is only valid for the exact recipients/subject/body the user saw in the preview.
// A different payload reusing an approved gate id (stale/replayed within the TTL) must not pass.
function emailApprovalMatches({ approvedInput, recipients, subject, body }: {
    approvedInput?: Record<string, unknown>
    recipients: string[]
    subject: string
    body: string
}): boolean {
    if (isNil(approvedInput)) {
        return false
    }
    const approvedRecipients = Array.isArray(approvedInput.to)
        ? unique(approvedInput.to.filter((email): email is string => typeof email === 'string').map((email) => email.toLowerCase().trim()))
        : []
    const sameRecipients = approvedRecipients.length === recipients.length && approvedRecipients.every((email) => recipients.includes(email))
    return sameRecipients && approvedInput.subject === subject && approvedInput.body === body
}
