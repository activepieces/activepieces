import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { projectHooks } from "@/hooks/project-hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApFlagId, ProjectWithLimits } from "../../../../shared/src";
import { projectApi } from "@/lib/project-api";
import { authenticationSession } from "@/lib/authentication-session";
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";
import { flagsHooks } from "@/hooks/flags-hooks";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function GeneralSettingsPage() {

  const queryClient = useQueryClient();
  const { project, updateProject } = projectHooks.useCurrentProject();

  const isProjectLimitsEnabled = flagsHooks.useFlag(ApFlagId.PROJECT_LIMITS_ENABLED, queryClient); // Means that the user can change the project plan tasks

  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      displayName: project?.displayName,
      plan: {
        tasks: project?.plan?.tasks,
      },
    },
    resolver: typeboxResolver(ProjectWithLimits),
  });

  const mutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      displayName: string;
      plan: { tasks: number };
    }
  >({
    mutationFn: (request) => {
      updateProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId(), request);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your changes have been saved.',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast(INTERNAL_ERROR_TOAST);
      console.log(error);
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>General</CardTitle>
        <CardDescription>
          Manage general settings for your project.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1 mt-4">
        {/* a Form with a save button as submit .. use form field to get and set the values */}
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
            {isProjectLimitsEnabled && <FormField
              name="plan.tasks"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="plan.tasks">
                    Tasks
                  </Label>
                  <Input
                    type="number"
                    {...field}
                    required
                    id="plan.tasks"
                    placeholder="Tasks"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />}
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <div className="flex gap-2 justify-end mt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutation.mutate(form.getValues());
            }}
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
