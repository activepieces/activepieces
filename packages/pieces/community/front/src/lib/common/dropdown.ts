import { Property } from "@activepieces/pieces-framework";
export const contactHandleSource = Property.StaticDropdown({
    displayName: "Source",
    description: "Source of the handle.",
    required: true,
    options: {
        options: [
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
            { label: "Twitter", value: "twitter" },
            { label: "Facebook", value: "facebook" },
            { label: "Intercom", value: "intercom" },
            { label: "Front Chat", value: "front_chat" },
            { label: "Custom", value: "custom" },
        ],
    }
});
