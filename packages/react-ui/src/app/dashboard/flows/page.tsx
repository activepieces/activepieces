import { Button } from "@/components/ui/button"
import { Payment, columns } from "./columnx"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"

export default function FlowsTable() {
    const data: Payment[] = [
        {
            id: "728ed52f",
            amount: 100,
            status: "pending",
            email: "m@example.com",
        },
    ]

    return (
        <div className="ap-container ap-mx-auto ap-py-10 ap-flex-col">
            <div className="ap-flex ap-mb-4">
                <h1 className="ap-text-3xl ap-font-bold">Flows</h1>
                <div className="ap-ml-auto">
                    <Link to='/builder'>
                        <Button variant="default" >New flow</Button>
                    </Link>
                </div>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    )
}