import { gmail } from '../src';
import { gmailScopes } from '../src/lib/auth';

describe('gmail piece registration', () => {
  it('registers the #8072 write actions and triggers', () => {
    expect(Object.keys(gmail.actions())).toEqual(
      expect.arrayContaining([
        'add_label_to_email',
        'remove_label_from_email',
        'create_label',
        'archive_email',
        'delete_email',
        'remove_label_from_thread',
      ])
    );
    expect(Object.keys(gmail.triggers())).toEqual(
      expect.arrayContaining(['new_starred_email', 'new_conversation'])
    );
  });

  it('tags the new actions for agents and classifies archive/delete as destructive', () => {
    const addLabel = gmail.getAction('add_label_to_email');
    expect(addLabel?.audience).toBe('both');
    expect(addLabel?.classification).toBe('WRITE');
    expect(addLabel?.aiMetadata?.idempotent).toBe(true);

    expect(gmail.getAction('archive_email')?.classification).toBe(
      'DESTRUCTIVE'
    );
    expect(gmail.getAction('delete_email')?.classification).toBe(
      'DESTRUCTIVE'
    );
    expect(gmail.getTrigger('new_starred_email')?.classification).toBe('READ');
    expect(gmail.getTrigger('new_conversation')?.aiMetadata?.description).toMatch(
      /first-message timestamp/
    );
  });

  it('requests the modify and labels scopes needed for the new writes', () => {
    expect(gmailScopes).toEqual(
      expect.arrayContaining([
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels',
      ])
    );
  });
});
