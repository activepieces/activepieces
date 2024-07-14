import React, { createContext, useContext, useState } from "react";

interface NotificationContextType {
    showIssuesNotification: boolean;
    setShowIssuesNotification: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotificationContext = createContext<NotificationContextType>({
    showIssuesNotification: false,
    setShowIssuesNotification: () => undefined
});

export const useNotificationContext = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [showIssuesNotification, setShowIssuesNotification] = useState(false)

    return (
        <NotificationContext.Provider value={{ showIssuesNotification, setShowIssuesNotification }}>
            {children}
        </NotificationContext.Provider>
    )
}