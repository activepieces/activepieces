import {
  Property,
  type InputPropertyMap,
  type ArraySubProps,
  type PropertyGroup,
} from "@activepieces/pieces-framework";
import type { FormItem, FormShape, Operation } from "./types";
import { birdAuth } from "../auth";
import { templatePicker } from "./template-picker";
import { isListOperation } from "./forms";

type Group = PropertyGroup;
const scalarKinds = new Set([
  "text",
  "json-or-text",
  "number",
  "boolean",
  "enum",
  "date-time",
]);

function scalar(
  node: FormShape,
  required = false,
): ArraySubProps<boolean>[string] {
  const base = { displayName: node.label, description: node.help, required };
  if (node.kind === "boolean" || node.kind === "enum") {
    return Property.StaticDropdown({
      ...base,
      options: {
        options:
          node.kind === "boolean"
            ? [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]
            : (node.enum ?? []).map((value) => ({
                label: String(value),
                value,
              })),
      },
    });
  }
  if (node.kind === "number") return Property.Number(base);
  if (node.kind === "date-time") return Property.DateTime(base);
  return ["html", "text", "body", "content"].includes(node.name)
    ? Property.LongText(base)
    : Property.ShortText(base);
}

function rowProperties(
  node: FormItem,
  attachment = false,
): ArraySubProps<boolean> | undefined {
  if (scalarKinds.has(node.kind))
    return {
      value: scalar(
        {
          ...node,
          name: node.name ?? "value",
          label: "Value",
        },
        true,
      ),
    };
  if (
    node.kind !== "object" ||
    !node.children?.every((child) => scalarKinds.has(child.kind))
  )
    return undefined;
  return Object.fromEntries(
    node.children.map((child) => [
      child.name,
      attachment && child.name === "content"
        ? Property.File({
            displayName: "File",
            description: "Enter a file URL or map a file from an earlier step.",
            required: true,
          })
        : scalar(
            attachment && child.name === "filename"
              ? { ...child, help: "Leave blank to use the file's name." }
              : child,
            attachment && child.name === "filename"
              ? false
              : (child.required ?? false),
          ),
    ]),
  );
}

function renderNode(
  node: FormShape,
  key: string,
  props: InputPropertyMap,
  required = false,
  inputMode?: "fields" | "json",
  action?: string,
  templateSource?: string,
): void {
  if (scalarKinds.has(node.kind)) {
    props[key] = scalar(node, required);
    return;
  }
  const base = {
    displayName: node.label,
    description: node.help,
    required,
  };
  if (node.kind === "json" || inputMode === "json") {
    props[key] = Property.Json({
      ...base,
      displayName: `${node.label} (JSON)`,
      advanced: false,
    });
    return;
  }
  if (!inputMode)
    props[`${key}__input_mode`] = Property.StaticDropdown({
      displayName: `${node.label} input`,
      description:
        "Choose Advanced JSON to use the matching field in the Advanced section below.",
      required: false,
      defaultValue: "fields",
      options: {
        options: [
          { label: "Fields", value: "fields" },
          { label: "Advanced JSON", value: "json" },
        ],
      },
    });
  if (node.kind === "object") {
    for (const child of node.children ?? []) {
      if (node.name === "template" && action) {
        if (child.name === "id") {
          if (templateSource !== "template_slug")
            props[`${key}__id`] = Property.StaticDropdown({
              displayName: "Template",
              required: true,
              options: { options: [] },
            });
          continue;
        }
        if (child.name === "slug" && templateSource !== "template_slug")
          continue;
      }
      renderNode(
        child,
        `${key}__${child.name}`,
        props,
        node.name === "template" && child.name === "slug"
          ? true
          : required && (child.required ?? false),
        inputMode,
        action,
        templateSource,
      );
    }
  } else if (node.kind === "dictionary") {
    props[key] = Property.Object(base);
    if (!inputMode)
      props[`${key}__json`] = Property.Json({
        ...base,
        displayName: `${node.label} (advanced JSON)`,
        description:
          "Choose Advanced JSON above to map an object with nested values.",
        advanced: true,
      });
    return;
  } else if (
    (node.kind === "array" || node.kind === "template-components") &&
    node.item
  ) {
    const properties = rowProperties(node.item, node.name === "attachments");
    if (properties) {
      props[`${key}__rows`] = Property.Array({
        ...base,
        displayName:
          node.kind === "template-components"
            ? "Body text variables"
            : node.label,
        description:
          node.kind === "template-components"
            ? "Add values in placeholder order, or enter names for a named template. Choose Content input: Advanced JSON for headers, buttons, or other blocks."
            : node.help,
        properties,
      });
    }
  }
  if (inputMode === "fields") return;
  props[key] = Property.Json({
    ...base,
    displayName: `${node.label} (advanced JSON)`,
    description: "Choose Advanced JSON above to map the complete value.",
    advanced: true,
  });
}

function renderFields(
  operation: Operation,
  keys: string[],
  inputMode?: "fields" | "json",
  templateSource?: string,
): InputPropertyMap {
  const props: InputPropertyMap = {};
  for (const key of keys) {
    const field = operation.fields.find((field) => field.key === key);
    if (!field) continue;
    if (
      ["array", "object", "dictionary"].includes(field.form.kind) &&
      !inputMode
    ) {
      props[`${key}__input_mode`] = Property.StaticDropdown({
        displayName: `${field.label} input`,
        required: field.required,
        defaultValue: "fields",
        options: {
          options: [
            { label: "Fields", value: "fields" },
            { label: "JSON", value: "json" },
          ],
        },
      });
      props[`${key}__input`] = Property.DynamicProperties({
        auth: birdAuth,
        displayName: field.label,
        required: field.required,
        refreshers: [
          `${key}__input_mode`,
          ...(!field.required ? [`${key}__enabled`] : []),
        ],
        props: async (values) =>
          !field.required && values[`${key}__enabled`] !== true
            ? {}
            : renderFields(
                operation,
                [key],
                values[`${key}__input_mode`] === "json" ? "json" : "fields",
              ),
      });
      continue;
    }
    renderNode(
      { ...field.form, label: field.label },
      field.key,
      props,
      field.required,
      inputMode,
      operation.name,
      templateSource,
    );
  }
  return props;
}

function listForm(operation: Operation): {
  props: InputPropertyMap;
  propertyGroups: Group[];
} {
  const props: InputPropertyMap = {};
  const propertyGroups: Group[] = [
    {
      key: "people",
      display: "section",
      label: "People",
      icon: "users",
      props: [],
    },
    {
      key: "message",
      display: "section",
      label: "Message",
      icon: "inbox",
      props: [],
    },
    {
      key: "date",
      display: "section",
      label: "Date",
      icon: "calendar",
      props: [],
    },
    {
      key: "results",
      display: "section",
      label: "Results",
      icon: "sliders",
      props: [],
    },
  ];
  for (const field of operation.fields) {
    const node = field.form;
    const key = field.key;
    const name = field.wireName;
    const groupKey =
      name === "limit"
        ? "results"
        : node.kind === "date-time"
          ? "date"
          : ["from", "to"].includes(name)
            ? "people"
            : ["status", "direction"].includes(name)
              ? "message"
              : undefined;
    const group = propertyGroups.find((group) => group.key === groupKey);
    const placeholders: Record<string, string> = {
      from:
        operation.name === "email_list" ||
        operation.name === "inbound_message_list"
          ? "sender@example.com"
          : "+31612345678",
      to:
        operation.name === "email_list"
          ? "recipient@example.com"
          : "+31612345678",
      tag: "order-confirmation",
      error_code: "unreachable",
      inbound_address_id: "Map an inbound address ID",
      bsuid: "Map a business-scoped user ID",
      group_id: "Map a WhatsApp group ID",
      starting_after: "Map next_cursor from a previous result",
      ending_before: "Map prev_cursor from a previous result",
    };
    const base = {
      displayName: name === "bsuid" ? "Business-scoped user ID" : field.label,
      description: field.help,
      required: false,
      advanced: !group,
      icon: ["from", "to", "bsuid", "group_id"].includes(name)
        ? name === "group_id"
          ? "users"
          : "user"
        : groupKey === "date"
          ? "calendar"
          : ["starting_after", "ending_before", "error_code"].includes(name)
            ? "code"
            : name === "inbound_address_id"
              ? "inbox"
              : "tag",
      placeholder:
        node.kind === "date-time" ? "2026-10-01T00:00:00Z" : placeholders[name],
    };
    if (name === "limit") {
      const schema = field.resolvedSchema;
      props[key] = Property.Number({
        ...base,
        displayName: "Page size",
        description: "The maximum number of messages to return in this page.",
        defaultValue:
          typeof schema?.["default"] === "number"
            ? schema["default"]
            : undefined,
        min:
          typeof schema?.["minimum"] === "number"
            ? schema["minimum"]
            : undefined,
        max:
          typeof schema?.["maximum"] === "number"
            ? schema["maximum"]
            : undefined,
        step: 1,
        display: "stepper",
      });
    } else if (name === "starting_after" || name === "ending_before") {
      props[key] = Property.ShortText({
        ...base,
        displayName:
          name === "starting_after"
            ? "Next page cursor"
            : "Previous page cursor",
      });
    } else if (node.kind === "array") {
      const smsStatus = operation.name === "sms_list" && name === "status";
      const choices = smsStatus
        ? [
            "scheduled",
            "accepted",
            "sent",
            "delivered",
            "undelivered",
            "failed",
            "rejected",
            "canceled",
            "expired",
            "received",
          ]
        : node.item?.enum;
      props[key] = choices?.length
        ? Property.StaticMultiSelectDropdown({
            ...base,
            ...(smsStatus
              ? {
                  description:
                    "Filter by one or more statuses. You can map other status strings. Scheduled and canceled currently return no messages.",
                }
              : {}),
            options: {
              options: choices.map((value) => ({
                label: String(value),
                value,
              })),
            },
          })
        : Property.Array(base);
    } else {
      renderNode({ ...node, label: field.label }, key, props, false, "fields");
      const property = props[key];
      property.displayName = base.displayName;
      property.description = base.description;
      property.icon = base.icon;
      property.placeholder = base.placeholder;
      property.advanced = base.advanced;
    }
    group?.props.push(key);
  }
  return {
    props,
    propertyGroups: propertyGroups.filter((group) => group.props.length > 0),
  };
}

export function actionForm(operation: Operation): {
  props: InputPropertyMap;
  propertyGroups: Group[];
} {
  if (isListOperation(operation)) return listForm(operation);
  const props: InputPropertyMap = {};
  const propertyGroups: Group[] = [];
  const branchFields = new Set(
    operation.contentModes.flatMap((mode) => mode.fields),
  );
  const ordered = [...operation.fields].sort((a, b) => {
    const rank = (name: string) =>
      ({ from: 0, to: 1, message_id: 2, code: 3 })[name] ?? 10;
    return rank(a.wireName) - rank(b.wireName);
  });
  const recipients = ordered.filter((field) =>
    ["from", "to", "message_id", "code"].includes(field.wireName),
  );
  const first = renderFields(
    operation,
    recipients.map((field) => field.key),
  );
  Object.assign(props, first);
  propertyGroups.push({
    key: "recipient",
    display: "section",
    label: operation.method === "GET" ? "Message" : "Sender and recipient",
    props: Object.keys(first).filter((key) => !first[key].advanced),
  });
  if (operation.contentModes.length) {
    props["content_mode"] = Property.StaticDropdown({
      displayName: "Content",
      required: true,
      defaultValue: operation.contentModes[0].value,
      options: {
        options: operation.contentModes.map((mode) => ({
          label: mode.label,
          value: mode.value,
        })),
      },
    });
    props["content_input_mode"] = Property.StaticDropdown({
      displayName: "Content input",
      required: false,
      defaultValue: "fields",
      options: {
        options: [
          { label: "Fields", value: "fields" },
          { label: "Advanced JSON", value: "json" },
        ],
      },
    });
    const parameterToggle = branchFields.has("body_parameters")
      ? ["body_parameters__enabled"]
      : [];
    if (parameterToggle.length)
      props["body_parameters__enabled"] = Property.Checkbox({
        displayName: "Add parameters",
        description:
          "Render Liquid expressions in a written message, even when Parameters is empty.",
        required: false,
        defaultValue: false,
      });
    props["content"] = Property.DynamicProperties({
      auth: birdAuth,
      displayName: "Message content",
      required: false,
      refreshers: ["content_mode", "content_input_mode", ...parameterToggle],
      props: async (values) => {
        const mode =
          operation.contentModes.find(
            (mode) => mode.value === values["content_mode"],
          ) ?? operation.contentModes[0];
        const fields = renderFields(
          operation,
          mode.fields.filter(
            (key) =>
              key !== "body_parameters" ||
              values["body_parameters__enabled"] === true,
          ),
          values["content_input_mode"] === "json" ? "json" : "fields",
          mode.value,
        );
        if (fields["body_template__id"])
          fields["body_template__id"] = await templatePicker({
            action: operation.name,
            auth: values["auth"],
          });
        return fields;
      },
    });
    propertyGroups.push({
      key: "content",
      display: "section",
      label: "Content",
      props: [
        "content_mode",
        "content_input_mode",
        ...parameterToggle,
        "content",
      ],
    });
  }
  for (const field of ordered) {
    if (recipients.includes(field) || branchFields.has(field.key)) continue;
    const fields = renderFields(operation, [field.key]);
    Object.assign(props, fields);
    const toggle = `${field.key}__enabled`;
    props[toggle] = Property.Checkbox({
      displayName: `Add ${field.label.toLowerCase()}`,
      required: false,
      defaultValue: false,
      reveals: Object.keys(fields).filter(
        (key) => !fields[key].advanced && fields[key].type !== "DYNAMIC",
      ),
    });
    let options = propertyGroups.find((group) => group.key === "options");
    if (!options) {
      options = {
        key: "options",
        display: "section",
        label: "Options",
        props: [],
      };
      propertyGroups.push(options);
    }
    options.props.push(
      toggle,
      ...Object.keys(fields).filter((key) => fields[key].type === "DYNAMIC"),
    );
  }
  return {
    props,
    propertyGroups: Object.keys(props).length <= 4 ? [] : propertyGroups,
  };
}
