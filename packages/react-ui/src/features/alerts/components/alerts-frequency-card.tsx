import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { projectHooks } from "@/features/projects/lib/project-hooks";
import { BellIcon, EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons"
import { useMutation } from "@tanstack/react-query";
import { AlertOption } from "./alert-option";
import { NotificationStatus, ProjectWithLimits } from "@activepieces/shared";
import { projectApi } from "@/features/projects/lib/project-api";
import { UpdateProjectPlatformRequest } from "@activepieces/ee-shared";
import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";

const AlertFrequencyCard = React.memo(() => {

  const queryClient = useQueryClient();
  const { data, setCurrentProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  const mutation = useMutation<ProjectWithLimits, Error, UpdateProjectPlatformRequest>({
    mutationFn: (request) => projectApi.update(authenticationSession.getProjectId(), request),
    onSuccess: (data) => {
      setCurrentProject(queryClient, data);
      toast({
        title: "Success",
        description: 'Your changes have been saved.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast(INTERNAL_ERROR_TOAST)
      console.log(error);
    },
  });

  const onChangeStatus = (status: NotificationStatus) => {
    mutation.mutate({
      notifyStatus: status,
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Alerts</CardTitle>
        <CardDescription>
          Choose what you want to be notified about.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        <AlertOption
          title="Every Failed Run"
          description="Get an email alert when a flow fails."
          onClick={() => onChangeStatus(NotificationStatus.ALWAYS)}
          icon={<BellIcon className="mt-px h-5 w-5" />}
          isActive={data?.notifyStatus === NotificationStatus.ALWAYS} />
        <AlertOption
          title="First Seen"
          description="Get an email alert when a new issue created."
          onClick={() => onChangeStatus(NotificationStatus.NEW_ISSUE)}
          icon={<EyeOpenIcon className="mt-px h-5 w-5" />}
          isActive={data?.notifyStatus === NotificationStatus.NEW_ISSUE} />
        <AlertOption title="Never"
          description="Turn off email notifications."
          onClick={() => onChangeStatus(NotificationStatus.NEVER)}
          icon={<EyeNoneIcon className="mt-px h-5 w-5" />}
          isActive={data?.notifyStatus === NotificationStatus.NEVER} />
      </CardContent>
    </Card>
  )
})

export { AlertFrequencyCard }