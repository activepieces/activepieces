import { Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./client";

export const partyIdDropdown = Property.Dropdown<string>({
    displayName: 'Contact (Party)',
    description: 'Select a Person or Organisation',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your Capsule CRM account first',
            };
        }

        try {
            const response = await makeRequest(
                auth as string,
                HttpMethod.GET,
                '/parties'
            );

            const parties = response.parties || [];

            return {
                disabled: false,
                options: parties.map((party: any) => {
                    let label = party.name || '';
                    if (party.firstName || party.lastName) {
                        label = `${party.firstName ?? ''} ${party.lastName ?? ''}`.trim();
                    }
                    return {
                        label: label || `Party ${party.id}`,
                        value: party.id,
                    };
                }),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading contacts (parties)',
            };
        }
    },
});

export const milestoneDropdown = Property.Dropdown<string>({
  displayName: "Milestone",
  description: "Select a milestone for the opportunity",
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your account first",
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        "/milestones"
      );


      const milestones = response.milestones || [];

      return {
        disabled: false,
        options: milestones.map((milestone: any) => ({
          label: milestone.name,
          value: milestone.id,
        })),
      };
    } catch (error) {
      console.error("Error fetching milestones:", error);
      return {
        disabled: true,
        options: [],
        placeholder: "Error loading milestones",
      };
    }
  },
});


export const opportunityIdDropdown = Property.Dropdown<string>({
  displayName: 'Opportunity ID',
  description: 'Select the opportunity to update',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/opportunities'
      );

      const opportunities = response.opportunities || [];

      return {
        disabled: false,
        options: opportunities.map((opp: any) => ({
          label: opp.name,
          value: opp.id,
        })),
      };
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading opportunities',
      };
    }
  },
});

export const ownerIdDropdown = Property.Dropdown<string>({
  displayName: 'Owner',
  description: 'Select the user who owns this entity',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(auth as string, HttpMethod.GET, '/users');
      const users = response.users || [];
      return {
        disabled: false,
        options: users.map((user: any) => ({
          label: user.name,
          value: user.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading users',
      };
    }
  },
});


export const projectIdDropdown = Property.Dropdown<string>({
  displayName: 'Project',
  description: 'Select the project (case) associated with this entry',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(auth as string, HttpMethod.GET, '/kases');
      const projects = response.kases || [];
      return {
        disabled: false,
        options: projects.map((project: any) => ({
          label: project.name,
          value: project.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading projects',
      };
    }
  },
});

