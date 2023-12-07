import { createAction, Property } from "@activepieces/pieces-framework";
import { saveGallery } from "../api";
import { cmsAuth } from "../auth";

export const saveGalleryAction = createAction({
	name        : 'saveGallery',
	auth        : cmsAuth,
	displayName : 'Save Gallery Image',
	description : 'Save image to Total CMS gallery',
	props       : {
		slug: Property.ShortText({
			displayName : 'CMS ID',
			description : 'The CMS ID of the gallery to save',
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
		return await saveGallery(context.auth, slug, image, {
			alt : context.propsValue.alt,
		});
	},
});


