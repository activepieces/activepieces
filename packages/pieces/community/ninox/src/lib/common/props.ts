import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";


export const teamidDropdown = Property.Dropdown({
    displayName: 'Team Id',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const teams = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/teams',
            {}
        );
        const options = teams.map((team: { id: string; name: string }) => {
            return {
                label: team.name,
                value: team.id,
            };
        });

        return {
            options,
        };
    },
})



export const databaseIdDropdown = Property.Dropdown({
    displayName: 'Database Id',
    required: true,
    refreshers: ['auth', 'teamid'],
    options: async ({ auth, teamid }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const databases = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/teams/${teamid}/databases`,
            {}
        );
        const options = databases.map((database: { id: string; name: string }) => {
            return {
                label: database.name,
                value: database.id,
            };
        });

        return {
            options,
        };
    },
})


export const tableIdDropdown = Property.Dropdown({
    displayName: 'Database Id',
    required: true,
    refreshers: ['auth', 'teamid', 'dbid'],
    options: async ({ auth, teamid, dbid }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const tables = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/teams/${teamid}/databases/${dbid}/tables`,
            {}
        );
        const options = tables.map((table: { id: string; name: string }) => {
            return {
                label: table.name,
                value: table.id,
            };
        });

        return {
            options,
        };
    },
})


export const recordIdDropdown = Property.Dropdown({
    displayName: 'Record Id',
    required: true,
    refreshers: ['auth', 'teamid', 'dbid', 'tid'],
    options: async ({ auth, teamid, dbid, tid }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const records = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`,
            {}
        );
        const options = records.map((record: { id: string; createdBy: string }) => {
            return {
                label: record.createdBy,
                value: record.id,
            };
        });

        return {
            options,
        };
    },
})



export const filenameDropdown = Property.Dropdown({
    displayName: 'File Name',
    required: true,
    refreshers: ['auth', 'teamid', 'dbid', 'tid', 'rid'],
    options: async ({ auth, teamid, dbid, tid, rid }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account',
                options: [],
            };
        }
        const tables = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}/files`,
            {}
        );
        const options = tables.map((table: { id: string; name: string }) => {
            return {
                label: table.name,
                value: table.id,
            };
        });

        return {
            options,
        };
    },
})