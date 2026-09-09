import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { floqerAuth } from '../auth';
import { floqerApi } from './client';
import {
    FloqerPaginationMeta,
    FloqerSegmentSummary,
    FloqerShortcut,
    FloqerWorkflowOverview,
    FloqerWorkflowSummary,
} from './types';

function workflowIdProp() {
    return Property.Dropdown({
        auth: floqerAuth,
        displayName: 'Workflow',
        description: 'The Floqer workflow that owns the sheet.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return disabled('Connect your Floqer account first.');
            }
            try {
                const response = await floqerApi.enveloped<FloqerWorkflowSummary[]>({
                    apiKey: auth.secret_text,
                    method: HttpMethod.GET,
                    path: '/api/v1/workflows/',
                });
                return {
                    disabled: false,
                    options: response.data.map((workflow) => ({
                        label: workflow.name,
                        value: workflow.workflow_id,
                    })),
                };
            } catch (error) {
                return disabled(floqerApi.describe(error, 'Could not load workflows.'));
            }
        },
    });
}

function sheetIdProp() {
    return Property.Dropdown({
        auth: floqerAuth,
        displayName: 'Sheet',
        description: 'The sheet inside the selected workflow.',
        required: true,
        refreshers: ['workflowId'],
        options: async ({ auth, workflowId }) => {
            if (!auth) {
                return disabled('Connect your Floqer account first.');
            }
            if (!workflowId) {
                return disabled('Select a workflow first.');
            }
            try {
                const response = await floqerApi.enveloped<FloqerWorkflowOverview>({
                    apiKey: auth.secret_text,
                    method: HttpMethod.GET,
                    path: `/api/v1/workflows/${workflowId}`,
                });
                return {
                    disabled: false,
                    options: response.data.sheets.map((sheet) => ({
                        label: sheet.is_main_sheet ? `${sheet.name} (main)` : sheet.name,
                        value: sheet.sheet_id,
                    })),
                };
            } catch (error) {
                return disabled(floqerApi.describe(error, 'Could not load sheets.'));
            }
        },
    });
}

function shortcutIdProp() {
    return Property.Dropdown({
        auth: floqerAuth,
        displayName: 'Shortcut',
        description: 'Published Floqer shortcuts you can run.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return disabled('Connect your Floqer account first.');
            }
            try {
                const response = await floqerApi.enveloped<FloqerShortcut[]>({
                    apiKey: auth.secret_text,
                    method: HttpMethod.GET,
                    path: '/api/v1/shortcuts/',
                    queryParams: { filter: 'all' },
                });
                const published = response.data.filter((shortcut) => shortcut.is_published);
                if (published.length === 0) {
                    return disabled('No published shortcuts found in this Floqer workspace.');
                }
                return {
                    disabled: false,
                    options: published.map((shortcut) => ({
                        label: shortcut.name,
                        value: shortcut.id,
                    })),
                };
            } catch (error) {
                return disabled(floqerApi.describe(error, 'Could not load shortcuts.'));
            }
        },
    });
}

function segmentIdProp() {
    return Property.Dropdown({
        auth: floqerAuth,
        displayName: 'Segment',
        description: 'The segment to watch for membership changes.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return disabled('Connect your Floqer account first.');
            }
            try {
                const segments = await fetchAllSegments(auth.secret_text);
                return {
                    disabled: false,
                    options: segments.map((segment) => ({
                        label: `${segment.name} (${segment.entityKind})`,
                        value: segment.id,
                    })),
                };
            } catch (error) {
                return disabled(floqerApi.describe(error, 'Could not load segments.'));
            }
        },
    });
}

async function fetchAllSegments(apiKey: string): Promise<FloqerSegmentSummary[]> {
    const collected: FloqerSegmentSummary[] = [];
    let offset = 0;
    for (let page = 0; page < SEGMENT_MAX_PAGES; page++) {
        const response = await floqerApi.bare<{
            data: FloqerSegmentSummary[];
            pagination: FloqerPaginationMeta;
        }>({
            apiKey,
            method: HttpMethod.GET,
            path: '/api/v1/ackdb/observe/segments',
            queryParams: { limit: String(SEGMENT_PAGE_SIZE), offset: String(offset) },
        });
        collected.push(...response.data);
        offset += response.data.length;
        if (response.data.length === 0 || collected.length >= response.pagination.total) {
            break;
        }
    }
    return collected;
}

function disabled(placeholder: string) {
    return {
        disabled: true,
        options: [],
        placeholder,
    };
}

export const floqerProps = {
    workflowId: workflowIdProp,
    sheetId: sheetIdProp,
    shortcutId: shortcutIdProp,
    segmentId: segmentIdProp,
};

const SEGMENT_PAGE_SIZE = 100;
const SEGMENT_MAX_PAGES = 20;
