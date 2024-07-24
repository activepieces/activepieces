import { FlowOperationType } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';

import { templatesApi } from '../lib/templates-api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/seperator';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PieceIcon } from '@/features/pieces/components/piece-icon';

const ShareTemplate: React.FC<{ templateId: string }> = ({ templateId }) => {
  const { data } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templatesApi.getTemplate(templateId),
    staleTime: 0,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: data!.projectId,
        displayName: data!.name,
      });
      const updatedFlow = await flowsApi.update(flow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: flow.version.displayName,
          trigger: flow.version.trigger,
        },
      });
      return updatedFlow;
    },
    onSuccess: (data) => {
      window.location.href = `/flows/${data.id}`;
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  console.log(data);

  return (
    <Card className="w-1/4">
      {data && (
        <>
          <CardHeader>
            <span className="font-semibold">{data.name}</span>
            <Separator />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 items-center justify-between mb-4">
                <div className="flex flex-row w-full justify-between items-center">
                  <span>Steps in this flow</span>
                  <div className="flex flex-row justify-between items-center gap-2">
                    {data.pieces.map((pieceName: string, index: number) => (
                      <PieceIcon
                        circle={true}
                        size={'md'}
                        border={true}
                        pieceName={pieceName}
                        key={index}
                      />
                    ))}
                  </div>
                </div>
                {data.description && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex flex-col w-full justify-start items-start">
                      <span className="font-semibold">Description</span>
                      <span>{data.description}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="ml-auto">
                <Button
                  variant={'secondary'}
                  className="mr-2"
                  onClick={() => (window.location.href = '/flows')}
                >
                  Cancel
                </Button>
                <Button loading={isPending} onClick={() => mutate()}>
                  Confirm
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export { ShareTemplate };
