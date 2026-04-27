/**
 * Shared dropdown factories for Activepieces props.
 */
import { Property } from "@activepieces/pieces-framework";
import { listChannels } from "@hulymcp/huly/operations/channels.js";
import { listComponents } from "@hulymcp/huly/operations/components.js";
import { listEmployees } from "@hulymcp/huly/operations/contacts.js";
import { listTeamspaces } from "@hulymcp/huly/operations/documents.js";
import { listMilestones } from "@hulymcp/huly/operations/milestones.js";
import { listProjects } from "@hulymcp/huly/operations/projects.js";
import { findProjectWithStatuses } from "@hulymcp/huly/operations/shared.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "./client";

export const projectDropdown = Property.Dropdown<string, true>({
  displayName: "Project",
  description: "Select a Huly project",
  required: true,
  refreshers: [],
  auth: hulyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    try {
      const result = await withHulyClient(auth, listProjects({}));
      return {
        disabled: false,
        options: result.projects.map((p) => ({
          label: `${p.name} (${p.identifier})`,
          value: p.identifier,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load projects. Check your connection.",
      };
    }
  },
});

export const statusDropdown = Property.Dropdown<string, false>({
  displayName: "Status",
  description: "Select a status for the issue",
  required: false,
  refreshers: ["project"],
  auth: hulyAuth,
  options: async ({ auth, project }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    if (!project) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please select a project first",
      };
    }
    try {
      const result = await withHulyClient(
        auth,
        findProjectWithStatuses(project)
      );
      return {
        disabled: false,
        options: result.statuses.map((s) => ({
          label: s.name,
          value: s.name,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load statuses. Check your connection.",
      };
    }
  },
});

export const priorityDropdown = Property.StaticDropdown<string, false>({
  displayName: "Priority",
  description: "Issue priority level",
  required: false,
  options: {
    options: [
      { label: "Urgent", value: "urgent" },
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
      { label: "No Priority", value: "no-priority" },
    ],
  },
});

export const assigneeDropdown = Property.Dropdown<string, false>({
  displayName: "Assignee",
  description: "Assign the issue to a team member",
  required: false,
  refreshers: [],
  auth: hulyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    try {
      const result = await withHulyClient(
        auth,
        listEmployees({ limit: 200 })
      );
      return {
        disabled: false,
        options: result
          .filter((e) => e.active)
          .map((e) => ({
            label: e.email ? `${e.name} (${e.email})` : e.name,
            value: e.email ?? e.name,
          })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load team members. Check your connection.",
      };
    }
  },
});

export const componentDropdown = Property.Dropdown<string, false>({
  displayName: "Component",
  description: "Select a component",
  required: false,
  refreshers: ["project"],
  auth: hulyAuth,
  options: async ({ auth, project }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    if (!project) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please select a project first",
      };
    }
    try {
      const components = await withHulyClient(
        auth,
        listComponents({ project, limit: 200 })
      );
      return {
        disabled: false,
        options: components.map((c) => ({
          label: c.label,
          value: c.label,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load components. Check your connection.",
      };
    }
  },
});

export const milestoneDropdown = Property.Dropdown<string, false>({
  displayName: "Milestone",
  description: "Select a milestone",
  required: false,
  refreshers: ["project"],
  auth: hulyAuth,
  options: async ({ auth, project }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    if (!project) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please select a project first",
      };
    }
    try {
      const milestones = await withHulyClient(
        auth,
        listMilestones({ project, limit: 200 })
      );
      return {
        disabled: false,
        options: milestones.map((m) => ({
          label: `${m.label} (${m.status})`,
          value: m.label,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load milestones. Check your connection.",
      };
    }
  },
});

export const teamspaceDropdown = Property.Dropdown<string, true>({
  displayName: "Teamspace",
  description: "Select a Huly teamspace",
  required: true,
  refreshers: [],
  auth: hulyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    try {
      const result = await withHulyClient(auth, listTeamspaces({}));
      return {
        disabled: false,
        options: result.teamspaces.map((t) => ({
          label: t.name,
          value: t.name,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load teamspaces. Check your connection.",
      };
    }
  },
});

export const channelDropdown = Property.Dropdown<string, true>({
  displayName: "Channel",
  description: "Select a Huly channel",
  required: true,
  refreshers: [],
  auth: hulyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Huly account first",
      };
    }
    try {
      const channels = await withHulyClient(auth, listChannels({}));
      return {
        disabled: false,
        options: channels.map((c) => ({
          label: c.name,
          value: c.name,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to load channels. Check your connection.",
      };
    }
  },
});
