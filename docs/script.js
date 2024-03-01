"use client";

// Get the Mintlify search containers, going to reuse them as the triggers for Inkeep
const searchButtonContainerIds = [
  "search-bar-entry",
  "search-bar-entry-mobile",
];

// Clone and replace, needed to remove existing event listeners
const clonedSearchButtonContainers = searchButtonContainerIds.map((id) => {
  const originalElement = document.getElementById(id);
  const clonedElement = originalElement.cloneNode(true);

  originalElement.parentNode.replaceChild(clonedElement, originalElement);

  return clonedElement;
});

// Load the Inkeep script
const inkeepScript = document.createElement("script");
inkeepScript.type = "module";
inkeepScript.src =
  "https://unpkg.com/@inkeep/widgets-embed@0.2.262/dist/embed.js";
document.body.appendChild(inkeepScript);

// Once the Inkeep script has loaded, load the Inkeep chat components
inkeepScript.addEventListener("load", function () {
  // Customization settings
  const sharedConfig = {
    baseSettings: {
      apiKey: "9b77dccb6cacb770614645da24b68c168dc213967b015a6f",
      integrationId: "clt6g42dh0008hl8duk922fjd",
      organizationId: "org_hCC6MgTLBCh3juv4",
      primaryBrandColor: "#8143E3",
    },
    aiChatSettings: {
      chatSubjectName: "Activepieces",
      botAvatarSrcUrl:
        "https://storage.googleapis.com/organization-image-assets/activepieces-botAvatarSrcUrl-1709136841325.svg",
      botAvatarDarkSrcUrl:
        "https://storage.googleapis.com/organization-image-assets/activepieces-botAvatarDarkSrcUrl-1709136840372.svg",
      getHelpCallToActions: [
        {
          name: "Discord",
          url: "https://discord.gg/2jUXBKDdP8",
          icon: {
            builtIn: "FaDiscord",
          },
        },
        {
          name: "Community",
          url: "https://community.activepieces.com/",
          icon: {
            builtIn: "IoPeopleOutline",
          },
        },
        {
          name: "GitHub",
          url: "https://github.com/activepieces/activepieces",
          icon: {
            builtIn: "FaGithub",
          },
        },
      ],
      quickQuestions: [
        "How do I conditionally change a flow?",
        "Can I incorporate custom external APIs?",
        "How do I monitor usage?",
      ],
    },
  };

  // for syncing with dark mode
  const colorModeSettings = {
    observedElement: document.documentElement,
    isDarkModeCallback: (el) => {
      return el.classList.contains("dark");
    },
    colorModeAttribute: "class",
  };

  // add the "Ask AI" pill chat button
  Inkeep().embed({
    componentType: "ChatButton",
    colorModeSync: colorModeSettings,
    properties: sharedConfig,
  });

  // instantiate Inkeep "custom trigger" component
  const inkeepSearchModal = Inkeep({
    ...sharedConfig.baseSettings,
  }).embed({
    componentType: "CustomTrigger",
    colorModeSync: colorModeSettings,
    properties: {
      ...sharedConfig,
      isOpen: false,
      onClose: () => {
        inkeepSearchModal.render({
          isOpen: false,
        });
      },
    },
  });

  // When the Mintlify search bar clone is clicked, open the Inkeep search modal
  clonedSearchButtonContainers.forEach((trigger) => {
    trigger.addEventListener("click", function () {
      inkeepSearchModal.render({
        isOpen: true,
      });
    });
  });
});
