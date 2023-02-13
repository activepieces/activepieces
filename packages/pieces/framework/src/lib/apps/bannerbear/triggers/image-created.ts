import { createTrigger, TriggerStrategy } from "../../../framework/trigger/trigger";

export const bannerBearImageCreated = createTrigger({
  name: "Image created trigger",
  displayName: "Banner bear image created", 
	description: "Image created notification", 
  triggerType: TriggerStrategy.WEBHOOK,
  sampleData: {
    "created_at": "2020-02-20T07:59:23.077Z",
    "status": "pending",
    "self": "https://api.bannerbear.com/v2/images/kG39R5XbvPQpLENKBWJj",
    "uid": "kG39R5XbvPQpLENKBWJj",
    "image_url": null,
    "template": "6A37YJe5qNDmpvWKP0",
    "modifications": [
      {
        "name": "title",
        "text": "Lorem ipsum dolor sit amed",
        "color": null,
        "background": null
      },
      {
        "name": "avatar",
        "image_url": "https://www.bannerbear.com/assets/sample_avatar.jpg"
      }
    ],
    "webhook_url": null,
    "webhook_response_code": null,
    "transparent": false,
    "metadata": null,
    "render_pdf": false,
    "pdf_url": null,
    "width": 1000,
    "height": 1000
  },
	props: { 
 
  },
	onEnable (ctx) {
    
  },
  onDisable (ctx) {
    const body = ctx.webhookUrl
    return [body];
  },
  async run(ctx) {
    const body = ctx.payload.body as { form_response: unknown };
    return [body.form_response];
  }
})