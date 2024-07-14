import { Folder, PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/seperator';
import { TextWithIcon } from '@/components/ui/text-with-icon';

const FolderFilterList = () => {
  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 flex items-center justify-center text-lg  font-semibold tracking-tight">
        <span className="flex">Folders</span>
        <div className="grow"></div>
        <div className="flex items-center justify-center">
          <Button variant="ghost">
            <PlusIcon size={18} />
          </Button>
        </div>
      </h2>
      <div className="flex w-[200px] flex-col space-y-1">
        <Button variant="secondary" className="flex w-full justify-start">
          <TextWithIcon icon={<Folder size={18} />} text="All flows" />
          <div className="grow"></div>
          <span className="text-muted-foreground">19</span>
        </Button>
        <Separator className="my-6" />
        <Button variant="ghost" className="w-full justify-start">
          HR Flows
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          Radio
        </Button>
      </div>
    </div>
  );
};

export { FolderFilterList };
