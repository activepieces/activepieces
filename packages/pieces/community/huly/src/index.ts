import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

// Import actions
import { findPerson } from './lib/actions/find-person';
import { findProject } from './lib/actions/find-project';
import { findIssue } from './lib/actions/find-issue';
import { findDocument } from './lib/actions/find-document';
import { createDocument } from './lib/actions/create-document';

// Import triggers
import { newIssueCreated } from './lib/triggers/new-issue-created';
import { newMilestoneCreated } from './lib/triggers/new-milestone-created';
import { newDocumentCreated } from './lib/triggers/new-document-created';
import { createPerson } from "./lib/actions/create-person";
import { createIssue } from "./lib/actions/create-issue";
import { createMilestone } from "./lib/actions/create-milestone";
import { newPersonCreated } from "./lib/triggers/new-person-created";

export const hulyAuth = PieceAuth.CustomAuth({
  description: "Huly Connection",
  required: true,
  props: {
    url: Property.ShortText({
      displayName: "Huly URL",
      description: "URL of the Huly instance (e.g., https://huly.app)",
      required: true,
    }),
    workspace: Property.ShortText({
      displayName: "Workspace",
      description: "Name of the workspace to connect to",
      required: true,
    }),
    authMethod: Property.StaticDropdown({
      displayName: "Authentication Method",
      description: "Choose how to authenticate with Huly",
      required: true,
      options: {
        options: [
          { label: "Email & Password", value: "emailPassword" },
          { label: "Token", value: "token" },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Your Huly email address",
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: "Password",
      description: "Your Huly password",
      required: false,
    }),
    token: PieceAuth.SecretText({
      displayName: "Token",
      description: "Your Huly authentication token",
      required: false,
    }),
  },
});

export const huly = createPiece({
  displayName: "Huly",
  auth: hulyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/huly.png",
  description: "Connect to Huly.io internal project and document management platform via MCP",
  authors: ["ActivePieces Team"],
  actions: [
    // Search Actions
    findPerson,
    findProject,
    findIssue,
    findDocument,
    // Write Actions
    createPerson,
    createIssue,
    createMilestone,
    createDocument,
  ],
  triggers: [
    newPersonCreated,
    newIssueCreated,
    newMilestoneCreated,
    newDocumentCreated,
  ],
  categories: [PieceCategory.PRODUCTIVITY],
});
