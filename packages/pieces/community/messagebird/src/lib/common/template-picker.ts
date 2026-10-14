import { Property } from "@activepieces/pieces-framework";
import definitions from "../../../generated/operations.json";
import { birdHttpClient } from "./http";
import { credentialForAuth, sendBirdRequest } from "./request";
import { isRecord } from "./values";

export async function templatePicker({
  action,
  auth,
}: {
  action: string;
  auth: unknown;
}) {
  const picker = definitions.pickers.find((picker) => picker.action === action);
  if (!picker) throw new Error(`Missing template picker for ${action}.`);
  const { method, path } = picker;
  return Property.StaticDropdown({
    displayName: "Template",
    description:
      "Choose an active template, or switch to a dynamic value to enter or map a template ID. To use a slug, choose Enter a template slug under Content. The list shows up to 300 templates.",
    required: true,
    options: await loadOptions().catch(() => ({
      options: [],
      placeholder:
        "Templates could not be loaded. Switch to a dynamic value to enter or map a template ID.",
    })),
  });
  async function loadOptions() {
    if (!auth)
      return {
        disabled: true,
        placeholder: "Connect your Bird workspace first.",
        options: [],
      };
    const accessToken = credentialForAuth(auth);
    const options = new Map<string, { label: string; value: string }>();
    const cursors = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 3; page++) {
      const response = await sendBirdRequest({
        accessToken,
        httpClient: birdHttpClient,
        method,
        path,
        queryParams: {
          limit: "100",

          ...(cursor ? { starting_after: cursor } : {}),
        },
      });
      if (!isRecord(response.body) || !Array.isArray(response.body["data"]))
        throw new Error("Bird returned an invalid template list. Try again.");
      for (const row of response.body["data"]) {
        if (
          !isRecord(row) ||
          typeof row["id"] !== "string" ||
          row["status"] !== "active"
        )
          continue;
        const name = typeof row["name"] === "string" ? row["name"] : row["id"];
        const slug = typeof row["slug"] === "string" ? row["slug"] : "";
        options.set(row["id"], {
          label: `${name}${slug ? ` (${slug})` : ""} · ${row["id"]}`,
          value: row["id"],
        });
      }
      cursor =
        typeof response.body["next_cursor"] === "string" &&
        response.body["next_cursor"]
          ? response.body["next_cursor"]
          : undefined;
      if (!cursor || cursors.has(cursor)) break;
      cursors.add(cursor);
    }
    return {
      options: [...options.values()],
      placeholder: cursor
        ? "Enter a template ID if it is not in this list."
        : options.size
          ? "Choose a template"
          : "No active templates found. Publish a template in Bird.",
    };
  }
}
