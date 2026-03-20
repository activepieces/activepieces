/**
 * Huly auth definition — CustomAuth with url, workspace, and either
 * API token (preferred) or email+password.
 */
import { PieceAuth, Property } from "@activepieces/pieces-framework";

import { withHulyClient } from "./common/client";

import { listProjects } from "@hulymcp/huly/operations/projects.js";

export const hulyAuth = PieceAuth.CustomAuth({
  displayName: "Huly Connection",
  description:
    "Connect to your Huly instance. Provide either an API token (recommended) or email + password.",
  required: true,
  props: {
    url: Property.ShortText({
      displayName: "Huly URL",
      description:
        "Your Huly instance URL (e.g., https://huly.app for cloud, or https://huly.yourdomain.com for self-hosted)",
      required: true,
      defaultValue: "https://huly.app",
    }),
    workspace: Property.ShortText({
      displayName: "Workspace",
      description:
        "Your Huly workspace identifier (found in your workspace URL after the domain)",
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: "API Token",
      description:
        "Huly API token (recommended). If provided, email and password are ignored.",
      required: false,
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Your Huly account email address (not needed if using API token)",
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: "Password",
      description: "Your Huly account password (not needed if using API token)",
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.token && (!auth.email || !auth.password)) {
      return {
        valid: false,
        error: "Provide either an API token, or both email and password.",
      };
    }
    try {
      await withHulyClient(
        {
          url: auth.url,
          workspace: auth.workspace,
          token: auth.token || undefined,
          email: auth.email || undefined,
          password: auth.password || undefined,
        },
        listProjects({ limit: 1 })
      );
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `Connection failed: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  },
});
