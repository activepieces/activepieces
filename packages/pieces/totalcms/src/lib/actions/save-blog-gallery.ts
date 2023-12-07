import { createAction, Property } from "@activepieces/pieces-framework";
import { saveBlogGallery } from "../api";
import { cmsAuth } from "../auth";

export const saveBlogGalleryAction = createAction({
	name        : 'saveBlogGallery',
	auth        : cmsAuth,
	displayName : 'Save Blog Post Gallery Image',
	description : 'Save image to Total CMS blog post gallery',
	props       : {
		slug: Property.ShortText({
			displayName : 'CMS ID',
			description : 'The CMS ID of the blog to save',
			required    : true,
		}),
		permalink: Property.ShortText({
			displayName : 'Permalink',
			description : 'The permalink of the blog post to save',
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
		return await saveBlogGallery(context.auth, slug, image, {
			alt       : context.propsValue.alt,
			permalink : context.propsValue.permalink,
		});
	},
});


