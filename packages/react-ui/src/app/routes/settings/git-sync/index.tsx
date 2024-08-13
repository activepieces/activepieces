import LockedFeatureGuard from "@/app/components/locked-feature-guard";
import { ApMarkdown } from "@/components/custom/markdown";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { platformHooks } from "@/hooks/platform-hooks";

const markdown = `
The Git Sync feature allows for the creation of an external backup, environments, and maintaining a version history, start by connecting the project to empty git repository.
`
const GitSyncPage = () => {

    return <>

        <div className="flex w-full flex-col items-start justify-center gap-4">
            <div className="flex justify-between items-center w-full">
                <h1 className="text-3xl font-bold flex-grow">Git Sync</h1>
                <Button size={"sm"}>
                    Connect Git
                </Button>
            </div>
            <ApMarkdown markdown={markdown} withBorder={false}></ApMarkdown>
            <div className="flex w-full">
                <Button size={"sm"} variant={"outline"} disabled={true}>
                    Pull from Git
                </Button>
            </div>
        </div>
    </>;
};

export { GitSyncPage };