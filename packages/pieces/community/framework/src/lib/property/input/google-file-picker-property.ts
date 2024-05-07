import { Type } from "@sinclair/typebox";
import { ValidationInputType } from "../../validators/types";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export enum GoogleFilePickerViewId {
  DOCS = "all",
  DOCS_IMAGES = "docs-images",
  DOCS_IMAGES_AND_VIDEOS = "docs-images-and-videos",
  DOCS_VIDEOS = "docs-videos",
  DOCUMENTS = "documents",
  DRAWINGS = "drawings",
  FOLDERS = "folders",
  FORMS = "forms",
  IMAGE_SEARCH = "image-search",
  MAPS = "maps",
  PDFS = "pdfs",
  PHOTOS = "photos",
  PHOTO_ALBUMS = "photo-albums",
  PHOTO_UPLOAD = "photo-upload",
  PRESENTATIONS = "presentations",
  RECENTLY_PICKED = "recently-picked",
  SPREADSHEETS = "spreadsheets",
  VIDEO_SEARCH = "video-search",
  WEBCAM = "webcam",
  YOUTUBE = "youtube",
}

export const GoogleFilePickerProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Unknown(), PropertyType.DROPDOWN),
  Type.Object({
    viewId: Type.Enum(GoogleFilePickerViewId),
  }),
]);

export type GoogleFilePickerProperty<R extends boolean> = BasePropertySchema & {
  viewId: GoogleFilePickerViewId
} & TPropertyValue<GoogleFilePickerPropertyValueSchema, PropertyType.GOOGLE_FILE_PICKER, ValidationInputType.ANY, R>;

export type GoogleFilePickerPropertyValueSchema = {
  fileId: string;
  fileDisplayName:string
};
