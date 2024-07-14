import { useEffect } from "react";
import { issuesApi } from "../api/issues-api";
import { useNotificationContext } from "@/contexts/notifications";

export const useIssuesNotification = () => {
    const { showIssuesNotification, setShowIssuesNotification } = useNotificationContext()

    useEffect(() => {
        handleFetchIssuesCount()
    })

    const handleFetchIssuesCount = async () => {
        const issuesCount = await issuesApi.count()
        setShowIssuesNotification(issuesCount > 0 ? true : false)
    }

    return showIssuesNotification
}