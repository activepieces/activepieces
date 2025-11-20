import { upsertRecord } from '../src/lib/actions/upsert-record';
import { httpClient } from '@activepieces/pieces-common';
import { tablesCommon } from '../src/lib/common';
import { FieldType, PopulatedRecord } from '@activepieces/shared';

// Mock dependencies
jest.mock('@activepieces/pieces-common', () => ({
  httpClient: {
    sendRequest: jest.fn(),
  },
  AuthenticationType: {
    BEARER_TOKEN: 'BEARER_TOKEN',
  },
  HttpMethod: {
    GET: 'GET',
    POST: 'POST',
  },
  propsValidation: {
    validateZod: jest.fn(),
  },
}));

jest.mock('../src/lib/common', () => ({
  tablesCommon: {
    convertTableExternalIdToId: jest.fn(),
    getTableFields: jest.fn(),
    createFieldValidations: jest.fn(),
    formatRecord: jest.fn((record) => record),
  },
}));

describe('upsertRecord', () => {
  const mockContext = {
    propsValue: {
      table_id: 'table-external-id',
      match_field: 'email-field-external-id',
      match_value: 'test@example.com',
      values: {
        'email-field-external-id': 'test@example.com',
        'name-field-external-id': 'John Doe',
      },
    },
    server: {
      apiUrl: 'https://api.example.com/',
      token: 'test-token',
    },
  };

  const mockTableFields = [
    {
      id: 'email-field-id',
      externalId: 'email-field-external-id',
      name: 'Email',
      type: FieldType.TEXT,
    },
    {
      id: 'name-field-id',
      externalId: 'name-field-external-id',
      name: 'Name',
      type: FieldType.TEXT,
    },
  ];

  const mockExistingRecord: PopulatedRecord = {
    id: 'existing-record-id',
    created: '2025-01-01T00:00:00Z',
    updated: '2025-01-01T00:00:00Z',
    tableId: 'table-internal-id',
    projectId: 'project-id',
    cells: {
      'email-field-id': {
        fieldName: 'Email',
        value: 'test@example.com',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
      'name-field-id': {
        fieldName: 'Name',
        value: 'Old Name',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    },
  };

  const mockNewRecord: PopulatedRecord = {
    id: 'new-record-id',
    created: '2025-01-02T00:00:00Z',
    updated: '2025-01-02T00:00:00Z',
    tableId: 'table-internal-id',
    projectId: 'project-id',
    cells: {
      'email-field-id': {
        fieldName: 'Email',
        value: 'test@example.com',
        created: '2025-01-02T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      },
      'name-field-id': {
        fieldName: 'Name',
        value: 'John Doe',
        created: '2025-01-02T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (tablesCommon.convertTableExternalIdToId as jest.Mock).mockResolvedValue('table-internal-id');
    (tablesCommon.getTableFields as jest.Mock).mockResolvedValue(mockTableFields);
    (tablesCommon.createFieldValidations as jest.Mock).mockReturnValue({});
  });

  describe('Update existing record', () => {
    test('should update record when match is found', async () => {
      // Mock search response - record exists
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [mockExistingRecord],
          },
        })
        // Mock update response
        .mockResolvedValueOnce({
          body: mockExistingRecord,
        });

      const result = await upsertRecord.run(mockContext as any);

      // Verify search was performed
      expect(httpClient.sendRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('v1/records'),
      }));

      // Verify update was performed
      expect(httpClient.sendRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({
        method: 'POST',
        url: 'https://api.example.com/v1/records/existing-record-id',
        body: expect.objectContaining({
          tableId: 'table-internal-id',
          cells: expect.arrayContaining([
            expect.objectContaining({
              fieldId: 'email-field-id',
              value: 'test@example.com',
            }),
            expect.objectContaining({
              fieldId: 'name-field-id',
              value: 'John Doe',
            }),
          ]),
        }),
      }));

      expect(result).toEqual(expect.objectContaining({
        operation: 'update',
      }));
    });

    test('should use correct filter for searching existing record', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [mockExistingRecord],
          },
        })
        .mockResolvedValueOnce({
          body: mockExistingRecord,
        });

      await upsertRecord.run(mockContext as any);

      const searchCall = (httpClient.sendRequest as jest.Mock).mock.calls[0][0];
      expect(searchCall.url).toContain('filters');
      expect(searchCall.url).toContain('email-field-id');
    });

    test('should only send non-empty values in update', async () => {
      const contextWithEmptyValues = {
        ...mockContext,
        propsValue: {
          ...mockContext.propsValue,
          values: {
            'email-field-external-id': 'test@example.com',
            'name-field-external-id': 'John Doe',
            'empty-field': '',
            'null-field': null,
            'undefined-field': undefined,
          },
        },
      };

      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [mockExistingRecord],
          },
        })
        .mockResolvedValueOnce({
          body: mockExistingRecord,
        });

      await upsertRecord.run(contextWithEmptyValues as any);

      const updateCall = (httpClient.sendRequest as jest.Mock).mock.calls[1][0];
      expect(updateCall.body.cells).toHaveLength(2);
      expect(updateCall.body.cells.every((c: any) => c.value !== '' && c.value !== null && c.value !== undefined)).toBe(true);
    });
  });

  describe('Create new record', () => {
    test('should create record when no match is found', async () => {
      // Mock search response - no record found
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        // Mock create response
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      const result = await upsertRecord.run(mockContext as any);

      // Verify search was performed
      expect(httpClient.sendRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('v1/records'),
      }));

      // Verify create was performed
      expect(httpClient.sendRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({
        method: 'POST',
        url: 'https://api.example.com/v1/records',
        body: expect.objectContaining({
          tableId: 'table-internal-id',
          records: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({
                fieldId: 'email-field-id',
                value: 'test@example.com',
              }),
              expect.objectContaining({
                fieldId: 'name-field-id',
                value: 'John Doe',
              }),
            ]),
          ]),
        }),
      }));

      expect(result).toEqual(expect.objectContaining({
        operation: 'create',
      }));
    });

    test('should create record with only non-empty values', async () => {
      const contextWithEmptyValues = {
        ...mockContext,
        propsValue: {
          ...mockContext.propsValue,
          values: {
            'email-field-external-id': 'test@example.com',
            'name-field-external-id': 'John Doe',
            'empty-field': '',
            'null-field': null,
          },
        },
      };

      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(contextWithEmptyValues as any);

      const createCall = (httpClient.sendRequest as jest.Mock).mock.calls[1][0];
      expect(createCall.body.records[0]).toHaveLength(2);
    });
  });

  describe('Error handling', () => {
    test('should throw error when match field is not found', async () => {
      const contextWithInvalidField = {
        ...mockContext,
        propsValue: {
          ...mockContext.propsValue,
          match_field: 'non-existent-field',
        },
      };

      await expect(upsertRecord.run(contextWithInvalidField as any)).rejects.toThrow(
        'Match field "non-existent-field" not found in table'
      );
    });

    test('should handle API errors during search', async () => {
      (httpClient.sendRequest as jest.Mock).mockRejectedValueOnce(
        new Error('API connection failed')
      );

      await expect(upsertRecord.run(mockContext as any)).rejects.toThrow('API connection failed');
    });

    test('should handle API errors during update', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [mockExistingRecord],
          },
        })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(upsertRecord.run(mockContext as any)).rejects.toThrow('Update failed');
    });

    test('should handle API errors during create', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockRejectedValueOnce(new Error('Create failed'));

      await expect(upsertRecord.run(mockContext as any)).rejects.toThrow('Create failed');
    });
  });

  describe('Field conversion', () => {
    test('should correctly convert external field IDs to internal IDs', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      const createCall = (httpClient.sendRequest as jest.Mock).mock.calls[1][0];
      const cells = createCall.body.records[0];

      expect(cells).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fieldId: 'email-field-id',
          }),
          expect.objectContaining({
            fieldId: 'name-field-id',
          }),
        ])
      );
    });

    test('should filter out fields that do not exist in table', async () => {
      const contextWithInvalidField = {
        ...mockContext,
        propsValue: {
          ...mockContext.propsValue,
          values: {
            'email-field-external-id': 'test@example.com',
            'non-existent-field': 'value',
          },
        },
      };

      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(contextWithInvalidField as any);

      const createCall = (httpClient.sendRequest as jest.Mock).mock.calls[1][0];
      const cells = createCall.body.records[0];

      expect(cells).toHaveLength(1);
      expect(cells[0].fieldId).toBe('email-field-id');
    });
  });

  describe('Authentication and retries', () => {
    test('should use correct authentication token', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      expect(httpClient.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          authentication: {
            type: 'BEARER_TOKEN',
            token: 'test-token',
          },
        })
      );
    });

    test('should set retries to 5 for all requests', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      const calls = (httpClient.sendRequest as jest.Mock).mock.calls;
      calls.forEach((call) => {
        expect(call[0].retries).toBe(5);
      });
    });
  });

  describe('Table field validation', () => {
    test('should call field validation', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      expect(tablesCommon.createFieldValidations).toHaveBeenCalledWith(mockTableFields);
    });

    test('should convert table external ID to internal ID', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      expect(tablesCommon.convertTableExternalIdToId).toHaveBeenCalledWith(
        'table-external-id',
        mockContext
      );
    });

    test('should get table fields for validation', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      expect(tablesCommon.getTableFields).toHaveBeenCalledWith({
        tableId: 'table-internal-id',
        context: mockContext,
      });
    });
  });

  describe('Search limit', () => {
    test('should limit search to 1 record', async () => {
      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: [],
          },
        })
        .mockResolvedValueOnce({
          body: [mockNewRecord],
        });

      await upsertRecord.run(mockContext as any);

      const searchCall = (httpClient.sendRequest as jest.Mock).mock.calls[0][0];
      expect(searchCall.url).toContain('limit=1');
    });

    test('should use first record when multiple matches found', async () => {
      const multipleRecords = [mockExistingRecord, { ...mockExistingRecord, id: 'another-id' }];

      (httpClient.sendRequest as jest.Mock)
        .mockResolvedValueOnce({
          body: {
            data: multipleRecords,
          },
        })
        .mockResolvedValueOnce({
          body: mockExistingRecord,
        });

      await upsertRecord.run(mockContext as any);

      const updateCall = (httpClient.sendRequest as jest.Mock).mock.calls[1][0];
      expect(updateCall.url).toContain('existing-record-id');
    });
  });
});
