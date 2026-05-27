function flattenTicket(ticket: GorgiasTicket) {
  return {
    id: ticket.id,
    subject: ticket.subject ?? null,
    status: ticket.status ?? null,
    priority: ticket.priority ?? null,
    channel: ticket.channel ?? null,
    via: ticket.via ?? null,
    language: ticket.language ?? null,
    is_spam: ticket.spam ?? null,
    messages_count: ticket.messages_count ?? null,
    customer_id: ticket.customer?.id ?? null,
    customer_email: ticket.customer?.email ?? null,
    customer_name: ticket.customer?.name ?? null,
    assignee_user_id: ticket.assignee_user?.id ?? null,
    assignee_user_email: ticket.assignee_user?.email ?? null,
    assignee_user_name: ticket.assignee_user?.name ?? null,
    assignee_team_id: ticket.assignee_team?.id ?? null,
    assignee_team_name: ticket.assignee_team?.name ?? null,
    tags: Array.isArray(ticket.tags) ? ticket.tags.map((tag) => tag.name).join(', ') : null,
    created_datetime: ticket.created_datetime ?? null,
    updated_datetime: ticket.updated_datetime ?? null,
    closed_datetime: ticket.closed_datetime ?? null,
  };
}

export const gorgiasTicket = { flattenTicket };

export type GorgiasTicket = {
  id: number;
  subject: string | null;
  status: string;
  priority: string;
  channel: string;
  via: string;
  language: string | null;
  spam: boolean;
  messages_count: number;
  customer?: { id: number; email: string | null; name: string | null };
  assignee_user?: { id: number; email: string; name: string | null };
  assignee_team?: { id: number; name: string };
  tags?: { id: number; name: string }[];
  created_datetime: string;
  updated_datetime: string;
  closed_datetime: string | null;
};
