import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BellIcon, EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons"


function AlertOption({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
      {icon}
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function AlertFrequencyCard() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Alerts</CardTitle>
        <CardDescription>
          Choose what you want to be notified about.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        <AlertOption title="Every Failed Run" description="Get an email alert when a flow fails." icon={<BellIcon className="mt-px h-5 w-5" />} />
        <AlertOption title="New Issue" description="Get an email alert when a new issue occurs." icon={<EyeOpenIcon className="mt-px h-5 w-5" />} />
        <AlertOption title="First Seen" description="Get an email alert when an issue is first seen." icon={<EyeNoneIcon className="mt-px h-5 w-5" />} />
      </CardContent>
    </Card>
  )
}