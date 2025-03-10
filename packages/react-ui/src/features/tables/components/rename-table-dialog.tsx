import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { t } from "i18next"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { tableHooks } from "../lib/ap-tables-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const RenameTableDialog = ({
    tableName,
    tableId,
    onRename,
    userHasTableWritePermission,
}: {
    tableName: string;
    tableId: string;
    onRename: () => void;
    userHasTableWritePermission: boolean;
}) => {
    const form = useForm<{ name: string }>({
        defaultValues: {
          name: tableName,
        },
        resolver: zodResolver(
          z.object({
            name: z.string().min(1, { message: t('Name is required') }),
          }),
        ),
      });
      const [showRenameTableDialog, setShowRenameTableDialog] = useState(false);
      const queryClient = useQueryClient();
      const { mutate: updateTable, isPending: isUpdatingTable } = tableHooks.useUpdateTable({
        queryClient: queryClient,
        tableId: tableId,
        onSuccess: ()=>{
            setShowRenameTableDialog(false);
            onRename();
            toast({
                title: t('Table renamed'),
                description: `${tableName} ${t('renamed to')} ${form.getValues('name')}`,
            });
        }
      });
   return <Tooltip>
    <Dialog open={showRenameTableDialog} onOpenChange={setShowRenameTableDialog}>
    <TooltipTrigger asChild disabled={!userHasTableWritePermission}>
      <DialogTrigger asChild>
          <Button variant="ghost" type="button" size="icon" disabled={!userHasTableWritePermission} onClick={(e) => e.stopPropagation()}>
              <Pencil className="h-4 w-4" />
          </Button>
      </DialogTrigger>
      </TooltipTrigger>
      {
          userHasTableWritePermission && (
            <TooltipContent>
              {t('Rename')}
            </TooltipContent>
          )
        }
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                updateTable({ name: data.name }),
              )}
            >
              <DialogHeader>
                <DialogTitle>{t('Rename')} {tableName}</DialogTitle>
              </DialogHeader>
              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder={t('Table name')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    {t('Cancel')}
                  </Button>
                </DialogClose>

                <Button type="submit" loading={isUpdatingTable}>
                  {t('Confirm')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
   </Tooltip>
}

RenameTableDialog.displayName = 'RenameTableDialog';

export default RenameTableDialog;