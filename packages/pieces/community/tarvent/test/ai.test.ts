import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ok, runAction } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

import { tarvent } from '../src';
import { upsertContactAi } from '../src/lib/actions/ai/upsert-contact-ai';
import { updateContactAi } from '../src/lib/actions/ai/update-contact-ai';
import { setContactTagsAi } from '../src/lib/actions/ai/set-contact-tags-ai';
import { setContactGroupMembershipAi } from '../src/lib/actions/ai/set-contact-group-membership-ai';
import { setJourneyStatusAi } from '../src/lib/actions/ai/set-journey-status-ai';
import { findContactAi } from '../src/lib/actions/ai/find-contact-ai';

function call(index = 0) {
  return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('audience split', () => {
  it('has 13 ai, 16 human and 11 both actions', () => {
    const actions = Object.values(tarvent.actions());
    const count = (audience: string) => actions.filter((a) => a.audience === audience).length;
    expect({ ai: count('ai'), human: count('human'), both: count('both') }).toEqual({ ai: 13, human: 16, both: 11 });
  });

  it('agent tools take plain text IDs, never dropdowns', () => {
    for (const action of Object.values(tarvent.actions()).filter((a) => a.audience === 'ai')) {
      for (const [key, prop] of Object.entries(action.props)) {
        expect(['DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC'], `${action.name}.${key}`).not.toContain(prop.type);
      }
    }
  });

  it('keeps Send Campaign and the suppression bypass away from agents', () => {
    const agentNames = Object.values(tarvent.actions()).filter((a) => a.audience !== 'human').map((a) => a.name);
    expect(agentNames).not.toContain('tarvent_send_campaign');
    expect(agentNames).not.toContain('tarvent_create_transaction');
    expect(agentNames).not.toContain('tarvent_remove_suppression_filter');
  });
});

describe('ai tools', () => {
  it('Create or Update Contact (AI) only ever adds groups and tags', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createContact: { id: 'c1' } } }));
    await runAction({ action: upsertContactAi, propsValue: { audienceId: 'a1', email: 'x@example.com', firstName: ' Ann ', lastName: '', tags: 'VIP, ', groupIds: 'g1', customFields: { f1: '1' } } });
    expect(call().body.variables.input).toEqual({
      firstName: 'Ann',
      email: 'x@example.com',
      audienceId: 'a1',
      updateExisting: true,
      audienceGroupManagementType: 'ADD_NEW_GROUPS_ONLY',
      tagManagementType: 'ADD_NEW_TAGS_ONLY',
      profile: [{ dataFieldId: 'f1', value: '1' }],
      tags: ['VIP'],
      groupIds: ['g1'],
      sendFormat: 'MULTIPART',
    });
  });

  it('Create or Update Contact (AI) updates by default and fails only when asked', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createContact: { id: 'c1' } } }));
    await runAction({ action: upsertContactAi, propsValue: { audienceId: 'a1', email: 'x@example.com', groupIds: '', tags: '' } });
    expect(call().body.variables.input).toMatchObject({ updateExisting: true });
    expect(call().body.variables.input).not.toHaveProperty('tags');
    expect(call().body.variables.input).not.toHaveProperty('groupIds');
    sendRequest.mockResolvedValueOnce(ok({ data: { createContact: { id: 'c1' } } }));
    await runAction({ action: upsertContactAi, propsValue: { audienceId: 'a1', email: 'x@example.com', ifExists: 'FAIL' } });
    expect(call(1).body.variables.input).toMatchObject({ updateExisting: false });
  });

  it('Update Contact (AI) sends only the given fields and refuses an empty update', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { updateContact: { id: 'c1' } } }));
    await runAction({ action: updateContactAi, propsValue: { audienceId: 'a1', contactId: 'c1', email: 'new@example.com' } });
    expect(call().body.variables.input).toEqual({ id: 'c1', audienceId: 'a1', email: 'new@example.com' });
    await expect(runAction({ action: updateContactAi, propsValue: { audienceId: 'a1', contactId: 'c1' } })).rejects.toThrow(/Nothing to update/);
  });

  it('Add or Remove Contact Tags (AI) maps the enum', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { updateContactTags: true } }));
    await runAction({ action: setContactTagsAi, propsValue: { audienceId: 'a1', contactId: 'c1', tags: ['A'], action: 'REMOVE' } });
    expect(call().body.variables.input).toEqual({ id: 'c1', audienceId: 'a1', operator: 'REMOVE', tags: ['A'] });
  });

  it('Add or Remove Contact From Group (AI) uses the right mutation', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { deleteGroupContact: { id: 'x' } } }));
    const result = await runAction({ action: setContactGroupMembershipAi, propsValue: { audienceId: 'a1', groupId: 'g1', contactId: 'c1', action: 'REMOVE' } });
    expect(call().body.query).toContain('deleteGroupContact');
    expect(result).toMatchObject({ action: 'REMOVE', groupId: 'g1' });
  });

  it('Start or Stop Journey (AI) fails when Tarvent does not confirm', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { startJourney: false } }));
    await expect(runAction({ action: setJourneyStatusAi, propsValue: { journeyId: 'j1', action: 'START' } })).rejects.toThrow(/did not confirm startJourney/);
  });

  it('Find Contact (AI) needs exactly one identifier', async () => {
    await expect(runAction({ action: findContactAi, propsValue: { audienceId: 'a1' } })).rejects.toThrow(/exactly one/);
  });
});
