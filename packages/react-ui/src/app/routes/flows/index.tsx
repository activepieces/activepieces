import { FlowsTable } from "@/features/flows/components/flow-table";
import { FolderFilterList } from "@/features/folders/component/folder-filter-list";

const FlowsPage = () => {
    return (
        <div className="container mx-auto flex py-10">
            <FlowsTable></FlowsTable>
        </div>
    )
}

export { FlowsPage }