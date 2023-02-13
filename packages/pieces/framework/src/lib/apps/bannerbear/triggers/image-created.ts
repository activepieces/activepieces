import { createTrigger, TriggerStrategy } from "../../../framework/trigger/trigger";

export const bannerBearImageCreated = createTrigger({
  name: "Image created trigger",
  displayName: "Banner bear image created", 
	description: "Image created notification", 
  triggerType: TriggerStrategy.WEBHOOK,
	props: {

  }
	onEnable: (ctx) => {

  }
  onDisable: (ctx) => {

  }
  run: async run(ctx): unknown[] => {
    
  }
})