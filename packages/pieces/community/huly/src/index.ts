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
  description: "Choose ONE authentication method below:",
  required: true,
  props: {
    url: Property.ShortText({
      displayName: "Huly URL",
      description: "URL of the Huly instance (e.g., https://huly.app)",
      required: true,
    }),
    workspace: Property.ShortText({
      displayName: "Workspace",
      description: "Name of the workspace to connect to (found in your Huly URL)",
      required: true,
    }),
    // Method 1: Email + Password
    email: Property.ShortText({
      displayName: "📧 Email (Method 1)",
      description: "For Email/Password auth: Enter your email address",
      required: false,
    }),
    password: Property.ShortText({
      displayName: "📧 Password (Method 1)",
      description: "For Email/Password auth: Enter your password",
      required: false,
    }),
    // Method 2: Token
    token: Property.ShortText({
      displayName: "🔑 Token (Method 2)",
      description: "For Token auth: Enter your authentication token",
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
