import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import { FieldType } from '@activepieces/shared';

import { fieldsApi } from './fields-api';
import { recordsApi } from './records-api';
import { tablesApi } from './tables-api';

const queryKeys = (searchParams: URLSearchParams, projectId: string) => {
  return ['tables', searchParams.toString(), projectId];
};
export const tableHooks = {
  useTables: (limit?: number) => {
    const projectId = authenticationSession.getProjectId();
    const [searchParams] = useSearchParams();
    return useQuery({
      queryKey: ['tables', searchParams.toString(), projectId],
      queryFn: () =>
        tablesApi.list({
          cursor: searchParams.get('cursor') ?? undefined,
          limit: limit
            ? limit
            : searchParams.get('limit')
            ? parseInt(searchParams.get('limit')!)
            : undefined,
          name: searchParams.get('name') ?? undefined,
        }),
    });
  },
  useCreateTable: () => {
    const projectId = authenticationSession.getProjectId() ?? '';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    return useMutation({
      mutationFn: async (data: { name: string }) => {
        const table = await tablesApi.create({ name: data.name });
        const field = await fieldsApi.create({
          name: 'Name',
          type: FieldType.TEXT,
          tableId: table.id,
        });
        await recordsApi.create({
          records: [
            ...Array.from({ length: 1 }, (_) => [
              {
                fieldId: field.id,
                value: '',
              },
            ]),
          ],
          tableId: table.id,
        });
        return table;
      },
      onSuccess: (table) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys(searchParams, projectId),
        });
        navigate(
          `/projects/${projectId}/tables/${table.id}?${NEW_TABLE_QUERY_PARAM}=true`,
        );
      },
    });
  },
};
