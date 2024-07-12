import { Separator } from "@radix-ui/react-dropdown-menu"
import { MiniSidebarNavItem } from "./mini-sidebar"

const sidebarNavItems = [
  {
    title: "General",
    href: "/settings/general",
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
  },
  {
    title: "Pieces",
    href: "/settings/pieces",
  },
  {
    title: "Git Sync",
    href: "/settings/git-sync",
  },
  {
    title: "Alerts",
    href: "/settings/alerts",
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}




export default function ProjectSettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <div className="container hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your project settings and preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <MiniSidebarNavItem items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  )
}