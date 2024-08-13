import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/ui/tag-input";
import { templatesApi } from "@/features/templates/lib/templates-api";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateFlowTemplateRequest } from "@activepieces/ee-shared"
import { FlowTemplate, TemplateType } from "@activepieces/shared"
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";

export const UpsertTemplateDialog = ({ children, onDone, template }: { children: React.ReactNode, onDone: () => void, template?: CreateFlowTemplateRequest }) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateFlowTemplateRequest>({
    defaultValues: {
      ...template,
      type: TemplateType.PLATFORM,
    },
    resolver: typeboxResolver(CreateFlowTemplateRequest),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationKey: ['create-template'],
    mutationFn: async () => {
      await templatesApi.create(form.getValues())
      onDone()
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
      onOpenChange={(open) => {
        setOpen(open)
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormField name="template.displayName" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="name">
                  Name
                </Label>
                <Input
                  {...field}
                  required
                  id="name"
                  placeholder="Template Name"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="description" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="description">
                  Description
                </Label>
                <Input
                  {...field}
                  required
                  id="description"
                  placeholder="Template Description"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="blogUrl" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="blogUrl">
                  Blog URL
                </Label>
                <Input
                  {...field}
                  required
                  id="blogUrl"
                  placeholder="Template Blog URL"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="template" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="flow">
                  Flow
                </Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    e.target.files && e.target.files[0].text().then((text) => {
                      const json = JSON.parse(text) as FlowTemplate;
                      json.template.displayName = form.getValues().template.displayName;
                      field.onChange(json.template);
                      console.log(json.template);
                    });
                  }}
                  required
                  id="flow"
                  placeholder="Template Flow"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="tags" render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="tags">
                  Tags
                </Label>
                <TagInput
                  onChange={tags => field.onChange(tags)}
                  value={field.value}
                />
                <FormMessage />
              </FormItem>
            )} />
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
