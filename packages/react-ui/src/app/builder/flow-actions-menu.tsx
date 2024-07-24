import { FlowTemplate } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronDown,
  Copy,
  Download,
  Import,
  Pencil,
  Share,
  Trash,
} from 'lucide-react';
import { useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { flowsApi } from '@/features/flows/lib/flows-api';

const FlowActionsMenu = () => {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const [menuOpen, setMenuOpen] = useState(false);

  const { mutate: exportFlow } = useMutation<FlowTemplate, Error, void>({
    mutationFn: async () =>
      flowsApi.getTemplate(flowVersion.flowId, {
        versionId: flowVersion.id,
      }),
    onSuccess: (flowTemplate) => {
      const file = new File(
        [JSON.stringify(flowTemplate, null, 2)],
        `${flowTemplate.name}.json`,
        { type: 'application/json' },
      );
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = flowTemplate.name;
      link.click();
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger>
        <ChevronDown size={16}></ChevronDown>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>Flow Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ImportFlowDialog>
          <DropdownMenuItem
            onSelect={(e) => {
              console.log('import clicked');
              setMenuOpen(false);
              e.preventDefault();
            }}
          >
            <Import className="mr-2 h-4 w-4" />
            <span>Import</span>
          </DropdownMenuItem>
        </ImportFlowDialog>
        <DropdownMenuItem onSelect={() => exportFlow()}>
          <Download className="mr-2 h-4 w-4" />
          <span>Export</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          <span>Share</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Trash className="mr-2 h-4 w-4 text-destructive" />
          <span className="text-destructive">Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

FlowActionsMenu.displayName = 'FlowActionsMenu';

export { FlowActionsMenu };
