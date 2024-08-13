import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";
import { projectApi } from "@/lib/project-api";
import { CreatePlatformProjectRequest } from "@activepieces/ee-shared";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const NewProjectDialog = ({ children, onCreate }: { children: React.ReactNode, onCreate: () => void }) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CreatePlatformProjectRequest>({
    resolver: typeboxResolver(CreatePlatformProjectRequest),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationKey: ['create-project'],
    mutationFn: async () => {
      await projectApi.create(form.getValues())
      onCreate()
    },
    onSuccess: () => {
      setOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => setOpen(open)}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormField
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">
                    Project Name
                  </Label>
                  <Input
                    {...field}
                    required
                    id="displayName"
                    placeholder="Project Name"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending || !form.formState.isValid}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
