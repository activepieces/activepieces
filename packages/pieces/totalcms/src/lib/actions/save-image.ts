import { createAction, Property } from "@activepieces/pieces-framework";
import { saveImage } from "../api";
import { cmsAuth } from "../auth";

export const saveImageAction = createAction({
	name        : 'saveImage',
	auth        : cmsAuth,
	displayName : 'Save Image',
	description : 'Save image to Total CMS',
	props       : {
		slug: Property.ShortText({
			displayName : 'CMS ID',
			description : 'The CMS ID of the content to save',
			required    : true,
		}),
		image: Property.File({
			displayName : 'Image',
			description : 'The image to save',
			required    : true,
		}),
		alt: Property.ShortText({
			displayName : 'Alt Text',
			description : 'The alt text for the image',
			required    : true,
		}),
	},
	async run(context) {
		const slug = context.propsValue.slug;
		const image = {
			filename : context.propsValue.image.filename,
			base64   : context.propsValue.image.base64,
		}
		return await saveImage(context.auth, slug, image, {
			alt : context.propsValue.alt,
		});
	},
});


