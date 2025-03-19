import { useContext } from "react";
import { FieldHeaderContext } from "../lib/utils";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import RenameFieldPopoverContent from "./rename-field-popovercontent";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";
import { useTableState } from "./ap-table-state-provider";
import { t } from "i18next";

export enum FieldActionType {
    DELETE,
    RENAME,
  }



  const ApFieldActionMenuItemRenderer = ({ 
    action
  }:{ 
    action: FieldActionType
  }) => {
    const fieldHeaderContext = useContext(FieldHeaderContext);
    if(!fieldHeaderContext){
      console.error('FieldHeaderContext not found');
      return null;
    }
    const {field, setIsPopoverOpen, setPopoverContent} = fieldHeaderContext;
    switch (action) {
      case FieldActionType.DELETE:
        const deleteField = useTableState((state) => state.deleteField);
        return (
          <ConfirmationDeleteDialog
            title={t('Delete Field')}
            message={t(
              'Are you sure you want to delete this field? This action cannot be undone.',
            )}
            mutationFn={async () => {
              await deleteField(field.index);
            }}
            entityName={t('field')}
          >
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setPopoverContent(null);
                setIsPopoverOpen(false);
              }}
              className="flex items-center gap-2 text-destructive cursor-pointer"
            >
              <Trash className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        );
      case FieldActionType.RENAME:
        return (<DropdownMenuItem
          onSelect={(e) => {
            setPopoverContent(<RenameFieldPopoverContent name={field.name} />);
            //this is needed because the popover is not open when the content is set
            // so we need to wait for the next frame to open it
            requestAnimationFrame(()=>{
              setIsPopoverOpen(true);
            });
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="h-4 w-4 " />
          <span >{t('Rename')}</span>
        </DropdownMenuItem>)
      default:
        return null;
    }
  };

  ApFieldActionMenuItemRenderer.displayName = 'ApFieldActionMenuItemRenderer';
  export default ApFieldActionMenuItemRenderer;