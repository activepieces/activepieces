import { beforeEach, describe, expect, it, vi } from 'vitest';

const mutate = vi.fn<() => Promise<unknown>>();
const search = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { mutate, search } };
});

const { createRecord } = await import('../../../src/lib/actions/create-record');
const { updateRecord } = await import('../../../src/lib/actions/update-record');
const { deleteRecord } = await import('../../../src/lib/actions/delete-record');

const AUTH = { access_token: 'ya29.test-token' };
const CID = '123-456-7890';

function actionContext(propsValue: Record<string, unknown>) {
  return { auth: AUTH, propsValue } as never;
}

describe('createRecord', () => {
  beforeEach(() => {
    mutate.mockReset();
    search.mockReset();
  });

  it('should read the record back when Google answers with the resource name only', async () => {
    mutate.mockResolvedValue({ mutateOperationResponses: [{ userListResult: { resourceName: 'customers/1234567890/userLists/9' } }] });
    search.mockResolvedValue({ results: [{ userList: { resourceName: 'customers/1234567890/userLists/9', id: '9', name: 'Newsletter' } }] });

    const output = await createRecord.run(
      actionContext({ customerId: CID, resourceType: 'user_list', record: { name: 'Newsletter', crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } } })
    );

    expect(search).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      query: expect.stringContaining("FROM user_list WHERE user_list.resource_name = 'customers/1234567890/userLists/9' LIMIT 1"),
    });
    expect(output).toEqual({
      resourceType: 'user_list',
      resourceName: 'customers/1234567890/userLists/9',
      id: '9',
      record: { userList: { resourceName: 'customers/1234567890/userLists/9', id: '9', name: 'Newsletter' } },
      validateOnly: false,
    });
  });

  it('should keep the successful write when the read back fails', async () => {
    mutate.mockResolvedValue({ mutateOperationResponses: [{ userListResult: { resourceName: 'customers/1234567890/userLists/9' } }] });
    search.mockRejectedValue(new Error('RESOURCE_EXHAUSTED'));

    const output = await createRecord.run(
      actionContext({ customerId: CID, resourceType: 'user_list', record: { name: 'Newsletter', crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } } })
    );

    expect(output).toEqual({
      resourceType: 'user_list',
      resourceName: 'customers/1234567890/userLists/9',
      id: '9',
      record: null,
      validateOnly: false,
    });
  });

  it('should send one create operation in the type envelope and return name, id and record', async () => {
    mutate.mockResolvedValue({
      mutateOperationResponses: [
        { campaignResult: { resourceName: 'customers/1234567890/campaigns/555', campaign: { id: '555', name: 'Spring sale' } } },
      ],
    });

    const output = await createRecord.run(
      actionContext({ customerId: CID, resourceType: 'campaign', record: { name: 'Spring sale', resourceName: 'ignored' } })
    );

    expect(mutate).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      operations: [{ campaignOperation: { create: { name: 'Spring sale' } } }],
      options: { validateOnly: false },
    });
    expect(output).toEqual({
      resourceType: 'campaign',
      resourceName: 'customers/1234567890/campaigns/555',
      id: '555',
      record: { campaign: { id: '555', name: 'Spring sale' } },
      validateOnly: false,
    });
  });

  it('should pass validateOnly through and report an empty answer as validated', async () => {
    mutate.mockResolvedValue({ mutateOperationResponses: [] });

    const output = await createRecord.run(
      actionContext({ customerId: CID, resourceType: 'ad_group', record: { name: 'x' }, validateOnly: true })
    );

    expect(mutate).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      operations: [{ adGroupOperation: { create: { name: 'x' } } }],
      options: { validateOnly: true },
    });
    expect(output).toEqual({ resourceType: 'ad_group', resourceName: null, id: null, record: null, validateOnly: true });
  });

  it('should reject unknown resource types before calling Google', async () => {
    await expect(createRecord.run(actionContext({ customerId: CID, resourceType: 'banner', record: {} }))).rejects.toThrow(
      'Unknown resource type'
    );
    expect(mutate).not.toHaveBeenCalled();
  });
});

describe('updateRecord', () => {
  beforeEach(() => {
    mutate.mockReset();
    search.mockReset().mockResolvedValue({ results: [] });
  });

  it('should derive the update mask from the fields and target the resource name', async () => {
    mutate.mockResolvedValue({
      mutateOperationResponses: [{ adGroupResult: { resourceName: 'customers/1234567890/adGroups/9' } }],
    });

    const output = await updateRecord.run(
      actionContext({
        customerId: CID,
        resourceType: 'ad_group',
        identifier: '9',
        record: { status: 'PAUSED', cpcBidMicros: '1500000' },
      })
    );

    expect(mutate).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      operations: [
        {
          adGroupOperation: {
            update: { status: 'PAUSED', cpcBidMicros: '1500000', resourceName: 'customers/1234567890/adGroups/9' },
            updateMask: 'status,cpcBidMicros',
          },
        },
      ],
      options: { validateOnly: false },
    });
    expect(output).toMatchObject({ resourceType: 'ad_group', resourceName: 'customers/1234567890/adGroups/9', id: '9' });
  });

  it('should accept composite ids for keywords', async () => {
    mutate.mockResolvedValue({ mutateOperationResponses: [{ adGroupCriterionResult: { resourceName: 'customers/1234567890/adGroupCriteria/1~2' } }] });

    await updateRecord.run(
      actionContext({ customerId: CID, resourceType: 'ad_group_criterion', identifier: '1~2', record: { status: 'PAUSED' } })
    );

    expect(mutate).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      operations: [
        {
          adGroupCriterionOperation: {
            update: { status: 'PAUSED', resourceName: 'customers/1234567890/adGroupCriteria/1~2' },
            updateMask: 'status',
          },
        },
      ],
      options: { validateOnly: false },
    });
  });

  it('should refuse an update without fields', async () => {
    await expect(
      updateRecord.run(actionContext({ customerId: CID, resourceType: 'campaign', identifier: '1', record: {} }))
    ).rejects.toThrow('Nothing to update');
    expect(mutate).not.toHaveBeenCalled();
  });
});

describe('deleteRecord', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('should send a remove operation and report the removal', async () => {
    mutate.mockResolvedValue({ mutateOperationResponses: [{ userListResult: { resourceName: 'customers/1234567890/userLists/3' } }] });

    const output = await deleteRecord.run(actionContext({ customerId: CID, resourceType: 'user_list', identifier: '3' }));

    expect(mutate).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      operations: [{ userListOperation: { remove: 'customers/1234567890/userLists/3' } }],
      options: { validateOnly: false },
    });
    expect(output).toEqual({
      resourceType: 'user_list',
      resourceName: 'customers/1234567890/userLists/3',
      id: '3',
      record: null,
      validateOnly: false,
      removed: true,
    });
  });

  it('should keep the resource name and not claim removal when validating only', async () => {
    mutate.mockResolvedValue({});

    const output = await deleteRecord.run(
      actionContext({ customerId: CID, resourceType: 'ad_group_ad', identifier: '4~5', validateOnly: true })
    );

    expect(output).toMatchObject({ resourceName: 'customers/1234567890/adGroupAds/4~5', removed: false, validateOnly: true });
  });
});
