import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/seperator";
import { Static, Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/components/theme-provider";

const AppearanceFormValues = Type.Object({
  theme: Type.Union([Type.Literal("light"), Type.Literal("dark")], {
    errorMessage: "Please select a theme.",
  }),
})
type AppearanceFormValues = Static<typeof AppearanceFormValues>

export default function SettingsAppearancePage() {

  const { theme, setTheme } = useTheme()

  const form = useForm<AppearanceFormValues>({
    resolver: typeboxResolver(AppearanceFormValues),
    defaultValues: { theme: theme === "dark" ? "dark" : "light" },
  })

  function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the app. Automatically switch between day
          and night themes.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Theme</FormLabel>
                <FormDescription>
                  Select the theme for the dashboard.
                </FormDescription>
                <FormMessage />
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid max-w-md grid-cols-2 gap-8 pt-2"
                >
                  <FormItem>
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                      <FormControl>
                        <RadioGroupItem value="light" className="sr-only" />
                      </FormControl>
                      <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">
                        Light
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                      <FormControl>
                        <RadioGroupItem value="dark" className="sr-only" />
                      </FormControl>
                      <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">
                        Dark
                      </span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormItem>
            )}
          />
          <Button type="submit">Update preferences</Button>
        </form>
      </Form>
    </div>
  )
}