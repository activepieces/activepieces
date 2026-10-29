import { Property } from "@activepieces/pieces-framework";
import { syconAuth } from "./auth";
import { api, keyOf } from "./client";

/**
 * Input fields. The named ones come from `generated/fields.json`, which is built from the API's own
 * OpenAPI document (see the README), so a field the API gains appears here after one command.
 */

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  choices?: string[];
  helpText?: string;
};

type Option = { label: string; value: string };
type Options = { disabled: boolean; options: Option[]; placeholder?: string };

const notConnected: Options = {
  disabled: true,
  options: [],
  placeholder: "Connect your Syncon One account first",
};

/** A pick-list read from the API with the flow's own key. */
function picker(
  displayName: string,
  required: boolean,
  load: (auth: unknown) => Promise<Option[]>,
) {
  return Property.Dropdown({
    auth: syconAuth,
    displayName,
    required,
    refreshers: [],
    options: async ({ auth }): Promise<Options> => {
      if (!auth) return notConnected;
      try {
        return { disabled: false, options: await load(auth) };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the connection.",
        };
      }
    },
  });
}

export const teammate = (displayName: string, required = false) =>
  picker(displayName, required, async (auth) => {
    const result = await api<{ data: Array<{ id: string; name: string }> }>(auth, {
      path: "/team/members",
    });
    return result.data.map((member) => ({ label: member.name, value: member.id }));
  });

export const pipelineChoice = (required = false) =>
  picker("Pipeline", required, async (auth) => {
    const result = await api<{ data: Array<{ id: string; name: string }> }>(auth, {
      path: "/pipelines",
    });
    return result.data.map((pipeline) => ({ label: pipeline.name, value: pipeline.id }));
  });

export const stageChoice = (required = false) =>
  picker("Stage", required, async (auth) => {
    const result = await api<{
      data: Array<{ name: string; stages: Array<{ id: string; label: string }> }>;
    }>(auth, { path: "/pipelines" });
    return result.data.flatMap((pipeline) =>
      pipeline.stages.map((stage) => ({
        label: `${pipeline.name}: ${stage.label}`,
        value: stage.id,
      })),
    );
  });

const TEAM_KEYS = new Set(["owner", "assignee"]);

/** One input per definition. */
export function propsFrom(
  defs: FieldDef[],
  options: { allOptional?: boolean; skip?: string[] } = {},
): Record<string, ReturnType<typeof Property.ShortText>> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    if (options.skip?.includes(def.key)) continue;
    const required = options.allOptional ? false : Boolean(def.required);
    const base = { displayName: def.label, description: def.helpText, required };
    if (TEAM_KEYS.has(def.key)) out[def.key] = teammate(def.label, required);
    else if (def.key === "stage") out[def.key] = stageChoice(required);
    else if (def.key === "pipeline") out[def.key] = pipelineChoice(required);
    else if (def.choices?.length) {
      out[def.key] = Property.StaticDropdown({
        ...base,
        options: { options: def.choices.map((choice) => ({ label: choice, value: choice })) },
      });
    } else if (def.type === "integer" || def.type === "number")
      out[def.key] = Property.Number(base);
    else if (def.type === "boolean") out[def.key] = Property.Checkbox({ ...base, required: false });
    else if (def.type === "datetime") out[def.key] = Property.DateTime(base);
    else out[def.key] = Property.ShortText(base);
  }
  return out as never;
}

/** Custom fields a flow can set on top of the named ones. */
export const extraFields = () =>
  Property.Object({
    displayName: "Custom fields",
    description:
      "Your own custom fields, by key, for example `contract_tier` and its value. Left blank, nothing extra is set.",
    required: false,
  });

/** The request body: named fields that were filled in, plus the custom ones. */
export function bodyFrom(
  values: Record<string, unknown>,
  defs: FieldDef[],
  extra?: unknown,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const def of defs) {
    const value = values[def.key];
    if (value === undefined || value === null || value === "") continue;
    body[def.key] = value;
  }
  for (const [key, value] of Object.entries((extra ?? values.extra_fields ?? {}) as object)) {
    if (value !== undefined && value !== null && value !== "") body[key] = value;
  }
  return body;
}

export { keyOf };
