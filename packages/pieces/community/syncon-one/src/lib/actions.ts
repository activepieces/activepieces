import { createAction, Property, type InputPropertyMap } from "@activepieces/pieces-framework";
import { createCustomApiCallAction, HttpMethod } from "@activepieces/pieces-common";
import fields from "../generated/fields.json";
import { syconAuth } from "./auth";
import { api, baseUrl, isMissing, keyOf } from "./client";
import { bodyFrom, extraFields, propsFrom, teammate, type FieldDef } from "./props";

/**
 * Every action is one call to the public API (`/api/v1`). What a key may do, and the reasons for a
 * refusal, come from the API, so a flow shows the API's own words when something is not allowed.
 */

type Values = Record<string, unknown>;
type Spec = {
  name: string;
  displayName: string;
  description: string;
  props: Record<string, unknown>;
  run: (input: { auth: unknown; props: Values }) => Promise<unknown>;
};

const action = (spec: Spec) =>
  createAction({
    auth: syconAuth,
    name: spec.name,
    displayName: spec.displayName,
    description: spec.description,
    props: spec.props as InputPropertyMap,
    async run(context) {
      return spec.run({ auth: context.auth, props: context.propsValue as Values });
    },
  });

const data = (result: { data: unknown }) => result.data;
const idProp = (displayName: string, description: string) =>
  Property.ShortText({ displayName, description, required: true });
const seg = (value: unknown) => encodeURIComponent(String(value ?? ""));
const asBool = (value: unknown, fallback = true) =>
  value === undefined || value === null || value === ""
    ? fallback
    : value === true || value === "true";

type Meta = {
  label: string;
  plural: string;
  path: string;
  create: FieldDef[];
  update: FieldDef[];
  filters: FieldDef[];
};
const records = (["person", "company", "lead", "opportunity"] as const).map((key) => ({
  key,
  meta: (fields as unknown as Record<string, Meta>)[key]!,
}));

/* ── customers, companies, leads, deals ────────────────────────────────────────────────── */

const recordActions = records.flatMap(({ key, meta }) => {
  const noun = meta.label;
  const lower = noun.toLowerCase();
  return [
    action({
      name: `create_${key}`,
      displayName: `Create ${noun}`,
      description: `Adds a ${lower} in Syncon One.`,
      props: { ...propsFrom(meta.create), extra_fields: extraFields() },
      run: async ({ auth, props }) =>
        data(
          await api(auth, {
            method: HttpMethod.POST,
            path: meta.path,
            body: bodyFrom(props, meta.create),
          }),
        ),
    }),
    action({
      name: `update_${key}`,
      displayName: `Update ${noun}`,
      description: `Changes a ${lower}. Only the fields you fill in are changed.`,
      props: {
        id: idProp(`${noun} ID`, `The id of the ${lower}, from a trigger or a search.`),
        ...propsFrom(meta.update, { allOptional: true }),
        extra_fields: extraFields(),
      },
      run: async ({ auth, props }) =>
        data(
          await api(auth, {
            method: HttpMethod.PATCH,
            path: `${meta.path}/${seg(props.id)}`,
            body: bodyFrom(props, meta.update),
          }),
        ),
    }),
    action({
      name: `get_${key}`,
      displayName: `Get ${noun}`,
      description: `Reads one ${lower} by its id.`,
      props: { id: idProp(`${noun} ID`, `The id of the ${lower}.`) },
      run: async ({ auth, props }) =>
        data(await api(auth, { path: `${meta.path}/${seg(props.id)}` })),
    }),
    action({
      name: `find_${key}`,
      displayName: `Find ${noun}`,
      description: `Finds ${meta.plural.toLowerCase()} by one or more details. Returns up to 25.`,
      props: propsFrom(meta.filters.map((filter) => ({ ...filter, required: false }))),
      run: async ({ auth, props }) => {
        const query: Record<string, unknown> = { limit: 25 };
        for (const filter of meta.filters)
          if (props[filter.key]) query[filter.key] = props[filter.key];
        const result = await api<{ data: unknown[] }>(auth, {
          path: meta.path,
          query: query as never,
        });
        return result.data;
      },
    }),
    action({
      name: `archive_${key}`,
      displayName: `Archive ${noun}`,
      description: `Archives a ${lower}. Archiving is not erasing: it leaves the lists and your team can restore it.`,
      props: { id: idProp(`${noun} ID`, `The ${lower} to archive.`) },
      run: async ({ auth, props }) =>
        data(await api(auth, { method: HttpMethod.DELETE, path: `${meta.path}/${seg(props.id)}` })),
    }),
  ];
});

/* ── tasks and notes ───────────────────────────────────────────────────────────────────── */

type Plain = { create: FieldDef[]; update: FieldDef[]; filters?: FieldDef[] };
const plain = (key: string) => (fields as unknown as Record<string, Plain>)[key]!;
const taskFields = plain("task");
const noteFields = plain("note");
const ticketFields = plain("ticket");
const meetingFields = plain("meeting");

const workActions = [
  action({
    name: "create_task",
    displayName: "Create Task",
    description:
      "Adds a task for your team, optionally linked to a customer, company, lead or deal.",
    props: propsFrom(taskFields.create),
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: "/tasks",
          body: bodyFrom(props, taskFields.create),
        }),
      ),
  }),
  action({
    name: "update_task",
    displayName: "Update Task",
    description: "Changes a task. Only the fields you fill in are changed.",
    props: {
      id: idProp("Task ID", "The task to change."),
      ...propsFrom(taskFields.update, { allOptional: true }),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.PATCH,
          path: `/tasks/${seg(props.id)}`,
          body: bodyFrom(props, taskFields.update),
        }),
      ),
  }),
  action({
    name: "complete_task",
    displayName: "Complete Task",
    description: "Marks a task done.",
    props: { id: idProp("Task ID", "The task to complete.") },
    run: async ({ auth, props }) =>
      data(await api(auth, { method: HttpMethod.POST, path: `/tasks/${seg(props.id)}/complete` })),
  }),
  action({
    name: "delete_task",
    displayName: "Delete Task",
    description: "Removes a task for good. Use Complete Task to keep its history.",
    props: { id: idProp("Task ID", "The task to delete.") },
    run: async ({ auth, props }) =>
      data(await api(auth, { method: HttpMethod.DELETE, path: `/tasks/${seg(props.id)}` })),
  }),
  action({
    name: "create_note",
    displayName: "Add Note",
    description: "Adds a note to a customer, company, lead or deal.",
    props: propsFrom(noteFields.create),
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: "/notes",
          body: bodyFrom(props, noteFields.create),
        }),
      ),
  }),
  action({
    name: "update_note",
    displayName: "Update Note",
    description: "Changes the text of a note, or pins or unpins it.",
    props: {
      id: idProp("Note ID", "The note to change."),
      ...propsFrom(noteFields.update, { allOptional: true }),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.PATCH,
          path: `/notes/${seg(props.id)}`,
          body: bodyFrom(props, noteFields.update),
        }),
      ),
  }),
  action({
    name: "delete_note",
    displayName: "Delete Note",
    description: "Removes a note from its record. Your team can still recover it.",
    props: { id: idProp("Note ID", "The note to delete.") },
    run: async ({ auth, props }) =>
      data(await api(auth, { method: HttpMethod.DELETE, path: `/notes/${seg(props.id)}` })),
  }),
];

/* ── tickets and meetings ──────────────────────────────────────────────────────────────── */

const attendeeEmails = (description: string) =>
  Property.LongText({ displayName: "Attendee emails", description, required: false });
const notify = (displayName: string) =>
  Property.Checkbox({ displayName, required: false, defaultValue: true });

function attendeesFrom(text: unknown): Array<{ email: string }> | undefined {
  if (!text) return undefined;
  const list = String(text)
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
  return list.length > 0 ? list : undefined;
}

function meetingBody(props: Values, defs: FieldDef[]): Values {
  const body = bodyFrom(
    props,
    defs.filter((def) => def.key !== "notify"),
  );
  const attendees = attendeesFrom(props.attendee_emails);
  if (attendees) body.attendees = attendees;
  body.notify = asBool(props.notify);
  return body;
}

const notNotify = (defs: FieldDef[]) => defs.filter((def) => def.key !== "notify");

const supportActions = [
  action({
    name: "create_ticket",
    displayName: "Create Ticket",
    description:
      "Opens a support ticket about a customer, company, lead or deal. Needs at least one of them.",
    props: propsFrom(ticketFields.create),
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: "/tickets",
          body: bodyFrom(props, ticketFields.create),
        }),
      ),
  }),
  action({
    name: "update_ticket",
    displayName: "Update Ticket",
    description:
      "Moves a ticket along, changes its priority or reassigns it. A move the ticket cannot make is refused.",
    props: {
      id: idProp("Ticket number", "The number of the ticket, as shown in the queue."),
      ...propsFrom(ticketFields.update, { allOptional: true }),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.PATCH,
          path: `/tickets/${seg(props.id)}`,
          body: bodyFrom(props, ticketFields.update),
        }),
      ),
  }),
  action({
    name: "find_ticket",
    displayName: "Find Ticket",
    description:
      "Finds tickets by number, or by status, priority, assignee or a word in the subject.",
    props: {
      id: Property.ShortText({
        displayName: "Ticket number",
        description: "Exact. Leave blank to search.",
        required: false,
      }),
      ...propsFrom((ticketFields.filters ?? []).map((filter) => ({ ...filter, required: false }))),
    },
    run: async ({ auth, props }) => {
      if (props.id) {
        try {
          return [data(await api(auth, { path: `/tickets/${seg(props.id)}` }))];
        } catch (error) {
          if (isMissing(error)) return [];
          throw error;
        }
      }
      const query: Record<string, unknown> = { limit: 25 };
      for (const filter of ticketFields.filters ?? []) {
        if (props[filter.key]) query[filter.key] = props[filter.key];
      }
      return (await api<{ data: unknown[] }>(auth, { path: "/tickets", query: query as never }))
        .data;
    },
  }),
  action({
    name: "schedule_meeting",
    displayName: "Schedule Meeting",
    description:
      "Schedules a meeting. It goes on the owner's calendar and the attendees are invited, unless Invite is off.",
    props: {
      ...propsFrom(notNotify(meetingFields.create)),
      attendee_emails: attendeeEmails(
        "Addresses to invite, separated by commas or new lines. Up to 20.",
      ),
      notify: notify("Invite the attendees"),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: "/meetings",
          body: meetingBody(props, meetingFields.create),
        }),
      ),
  }),
  action({
    name: "update_meeting",
    displayName: "Update Meeting",
    description:
      "Changes or moves a meeting. Only the fields you fill in change; moving it tells the attendees unless Tell is off.",
    props: {
      id: idProp("Meeting ID", "The meeting to change."),
      ...propsFrom(notNotify(meetingFields.update), { allOptional: true }),
      attendee_emails: attendeeEmails(
        "Replaces the whole list. Separate with commas or new lines. Leave blank to keep it.",
      ),
      notify: notify("Tell the attendees"),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.PATCH,
          path: `/meetings/${seg(props.id)}`,
          body: meetingBody(props, meetingFields.update),
        }),
      ),
  }),
  action({
    name: "cancel_meeting",
    displayName: "Cancel Meeting",
    description: "Cancels a meeting. It stays on the record, marked cancelled.",
    props: {
      id: idProp("Meeting ID", "The meeting to cancel."),
      notify: notify("Tell the attendees"),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: `/meetings/${seg(props.id)}/cancel`,
          body: { notify: asBool(props.notify) },
        }),
      ),
  }),
  action({
    name: "find_meeting",
    displayName: "Find Meeting",
    description: "Reads one meeting by id, or lists upcoming or past meetings.",
    props: {
      id: Property.ShortText({
        displayName: "Meeting ID",
        description: "Exact. Leave blank to list.",
        required: false,
      }),
      window: Property.StaticDropdown({
        displayName: "Which meetings",
        required: false,
        options: { options: ["upcoming", "past", "all"].map((value) => ({ label: value, value })) },
      }),
    },
    run: async ({ auth, props }) => {
      if (props.id) {
        try {
          return [data(await api(auth, { path: `/meetings/${seg(props.id)}` }))];
        } catch (error) {
          if (isMissing(error)) return [];
          throw error;
        }
      }
      return (
        await api<{ data: unknown[] }>(auth, {
          path: "/meetings",
          query: { window: (props.window as string) || "upcoming", limit: 25 },
        })
      ).data;
    },
  }),
];

/* ── the live chat inbox ───────────────────────────────────────────────────────────────── */

const conversationId = () =>
  idProp(
    "Conversation ID",
    "The id of the conversation, conv_…, from a trigger or Find Conversations.",
  );

const inboxViews = [
  "all",
  "mine",
  "unassigned",
  "needs_person",
  "waiting_customer",
  "waiting_teammate",
  "ai",
  "human",
  "unread",
  "sla_risk",
  "resolved",
];

const keys = (list: string[]): FieldDef[] => list.map((key) => ({ key, label: "" }));

const inboxActions = [
  action({
    name: "find_conversations",
    displayName: "Find Conversations",
    description: "Lists conversations in the live chat inbox.",
    props: {
      view: Property.StaticDropdown({
        displayName: "View",
        required: false,
        options: {
          options: inboxViews.map((value) => ({ label: value.replace(/_/g, " "), value })),
        },
      }),
      q: Property.ShortText({
        displayName: "Search",
        description: "The visitor, the site or a word.",
        required: false,
      }),
      responder: Property.StaticDropdown({
        displayName: "Answered by",
        required: false,
        options: {
          options: [
            { label: "AI agent", value: "ai" },
            { label: "A teammate", value: "human" },
          ],
        },
      }),
    },
    run: async ({ auth, props }) =>
      (
        await api<{ data: unknown[] }>(auth, {
          path: "/conversations",
          query: {
            view: props.view as string,
            q: props.q as string,
            responder: props.responder as string,
            limit: 50,
          },
        })
      ).data,
  }),
  action({
    name: "get_conversation_messages",
    displayName: "Get Conversation Messages",
    description:
      "Reads a conversation's thread, oldest first. Set After to the last cursor you have to read only what is new.",
    props: {
      id: conversationId(),
      after: Property.Number({ displayName: "After cursor", required: false }),
    },
    run: async ({ auth, props }) =>
      (
        await api<{ data: unknown[] }>(auth, {
          path: `/conversations/${seg(props.id)}/messages`,
          query: { after: (props.after as number) || 0, limit: 100 },
        })
      ).data,
  }),
  action({
    name: "join_conversation",
    displayName: "Join Conversation",
    description:
      "Takes a conversation over from the AI agent. The visitor sees a teammate arrive. Refused if another teammate has it.",
    props: { id: conversationId() },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: `/conversations/${seg(props.id)}/join`,
          body: {},
        }),
      ),
  }),
  action({
    name: "reply_to_conversation",
    displayName: "Reply to Conversation",
    description:
      "Sends a message the visitor reads at once, as the teammate your API key stands for. The conversation must be joined first.",
    props: {
      id: conversationId(),
      text: Property.LongText({ displayName: "Message", required: true }),
      client_message_id: Property.ShortText({
        displayName: "Your message id",
        description:
          "Optional. Sending the same id twice posts once, so a retried flow does not double-post.",
        required: false,
      }),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: `/conversations/${seg(props.id)}/reply`,
          body: bodyFrom(props, keys(["text", "client_message_id"])),
        }),
      ),
  }),
  action({
    name: "return_conversation_to_ai",
    displayName: "Hand Conversation Back to AI",
    description: "Returns a conversation to the AI agent. Only the teammate who holds it can.",
    props: { id: conversationId() },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: `/conversations/${seg(props.id)}/return-to-ai`,
          body: {},
        }),
      ),
  }),
  action({
    name: "update_conversation",
    displayName: "Update Conversation",
    description: "Sets a conversation's owner and priority, and adds or removes tags.",
    props: {
      id: conversationId(),
      assignee: teammate("Owner"),
      priority: Property.StaticDropdown({
        displayName: "Priority",
        required: false,
        options: {
          options: ["none", "low", "medium", "high", "urgent"].map((value) => ({
            label: value,
            value,
          })),
        },
      }),
      add_tags: Property.Array({ displayName: "Add tags", required: false }),
      remove_tags: Property.Array({ displayName: "Remove tags", required: false }),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.PATCH,
          path: `/conversations/${seg(props.id)}`,
          body: bodyFrom(props, keys(["assignee", "priority", "add_tags", "remove_tags"])),
        }),
      ),
  }),
  action({
    name: "add_conversation_note",
    displayName: "Add Internal Note to Conversation",
    description: "Adds a note only your team sees. The visitor never does.",
    props: {
      id: conversationId(),
      body: Property.LongText({ displayName: "Note", required: true }),
    },
    run: async ({ auth, props }) =>
      data(
        await api(auth, {
          method: HttpMethod.POST,
          path: `/conversations/${seg(props.id)}/notes`,
          body: { body: props.body },
        }),
      ),
  }),
  action({
    name: "find_teammate",
    displayName: "Find Teammate",
    description: "Finds people in your workspace by name, for use as an owner or assignee.",
    props: { name: Property.ShortText({ displayName: "Name contains", required: true }) },
    run: async ({ auth, props }) => {
      const wanted = String(props.name ?? "").toLowerCase();
      const result = await api<{ data: Array<{ name: string }> }>(auth, { path: "/team/members" });
      return result.data.filter((member) => member.name.toLowerCase().includes(wanted));
    },
  }),
];

/** Anything else in the API, with the connection's key added, for the endpoints with no action here. */
const customApiCall = createCustomApiCallAction({
  auth: syconAuth,
  baseUrl: () => baseUrl(),
  authMapping: async (auth) => ({ Authorization: `Bearer ${keyOf(auth)}` }),
});

export const actions = [
  ...recordActions,
  ...workActions,
  ...supportActions,
  ...inboxActions,
  customApiCall,
];
