import { Property } from '@activepieces/pieces-framework';

export const templateDropdown = Property.StaticDropdown({
  displayName: 'Template',
  description: 'Presentation template style',
  required: false,
  defaultValue: 'bullet-point1',
  options: {
    options: [
      { value: 'bullet-point1', label: 'Bullet Point 1' },
      { value: 'bullet-point2', label: 'Bullet Point 2' },
      { value: 'bullet-point4', label: 'Bullet Point 4' },
      { value: 'bullet-point5', label: 'Bullet Point 5' },
      { value: 'bullet-point6', label: 'Bullet Point 6' },
      { value: 'bullet-point7', label: 'Bullet Point 7' },
      { value: 'bullet-point8', label: 'Bullet Point 8' },
      { value: 'bullet-point9', label: 'Bullet Point 9' },
      { value: 'bullet-point10', label: 'Bullet Point 10' },
      { value: 'custom2', label: 'Custom 2' },
      { value: 'custom3', label: 'Custom 3' },
      { value: 'custom4', label: 'Custom 4' },
      { value: 'custom5', label: 'Custom 5' },
      { value: 'custom6', label: 'Custom 6' },
      { value: 'custom7', label: 'Custom 7' },
      { value: 'custom8', label: 'Custom 8' },
      { value: 'custom9', label: 'Custom 9' },
      { value: 'verticalBulletPoint1', label: 'Vertical Bullet Point 1' },
      { value: 'verticalCustom1', label: 'Vertical Custom 1' },
      { value: 'ed-bullet-point1', label: 'Editable Bullet Point 1' },
      { value: 'ed-bullet-point2', label: 'Editable Bullet Point 2' },
      { value: 'ed-bullet-point4', label: 'Editable Bullet Point 4' },
      { value: 'ed-bullet-point5', label: 'Editable Bullet Point 5' },
      { value: 'ed-bullet-point6', label: 'Editable Bullet Point 6' },
      { value: 'ed-bullet-point7', label: 'Editable Bullet Point 7' },
      { value: 'ed-bullet-point9', label: 'Editable Bullet Point 9' },
      { value: 'custom Dark 1', label: 'Custom Dark 1' },
      { value: 'Custom gold 1', label: 'Custom Gold 1' },
      { value: 'custom sync 1', label: 'Custom Sync 1' },
      { value: 'custom sync 2', label: 'Custom Sync 2' },
      { value: 'custom sync 3', label: 'Custom Sync 3' },
      { value: 'custom sync 4', label: 'Custom Sync 4' },
      { value: 'custom sync 5', label: 'Custom Sync 5' },
      { value: 'custom sync 6', label: 'Custom Sync 6' },
      { value: 'custom-ed-7', label: 'Custom Editable 7' },
      { value: 'custom-ed-8', label: 'Custom Editable 8' },
      { value: 'custom-ed-9', label: 'Custom Editable 9' },
      { value: 'custom-ed-10', label: 'Custom Editable 10' },
      { value: 'custom-ed-11', label: 'Custom Editable 11' },
      { value: 'custom-ed-12', label: 'Custom Editable 12' },
      { value: 'pitchdeckorignal', label: 'Pitch Deck Original' },
      { value: 'pitch-deck-2', label: 'Pitch Deck 2' },
      { value: 'pitch-deck-3', label: 'Pitch Deck 3' },
    ],
  },
});

export const languageDropdown = Property.ShortText({
  displayName: 'Language',
  description: 'Target language for the presentation',
  required: false,
  defaultValue: 'en',
});

export const slidesCountNumber = Property.Number({
  displayName: 'Number of Slides',
  description: 'Number of slides to generate (1-50)',
  required: false,
  defaultValue: 10,
});

export const aiImagesCheckbox = Property.Checkbox({
  displayName: 'AI Images',
  description: 'Enable AI-generated images',
  required: false,
  defaultValue: false,
});

export const imageForEachSlideCheckbox = Property.Checkbox({
  displayName: 'Image For Each Slide',
  description: 'Include images on every slide',
  required: false,
  defaultValue: true,
});

export const googleImageCheckbox = Property.Checkbox({
  displayName: 'Google Image',
  description: 'Use Google Images instead of AI images',
  required: false,
  defaultValue: false,
});

export const googleTextCheckbox = Property.Checkbox({
  displayName: 'Google Text',
  description: 'Use Google search for content enhancement',
  required: false,
  defaultValue: false,
});

export const modelDropdown = Property.StaticDropdown({
  displayName: 'Model',
  description: 'AI model to use',
  required: false,
  defaultValue: 'gpt-4',
  options: {
    options: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-3.5', label: 'GPT-3.5' },
    ],
  },
});

export const presentationForShortText = Property.ShortText({
  displayName: 'Presentation For',
  description: 'Target audience for the presentation',
  required: false,
});

export const watermarkWidthShortText = Property.ShortText({
  displayName: 'Watermark Width',
  description: 'Watermark width in pixels',
  required: false,
});

export const watermarkHeightShortText = Property.ShortText({
  displayName: 'Watermark Height',
  description: 'Watermark height in pixels',
  required: false,
});

export const watermarkBrandURLShortText = Property.ShortText({
  displayName: 'Watermark Brand URL',
  description: 'Watermark brand image URL',
  required: false,
});

export const watermarkPositionDropdown = Property.StaticDropdown({
  displayName: 'Watermark Position',
  description: 'Watermark position on slides',
  required: false,
  options: {
    options: [
      { value: 'TopLeft', label: 'Top Left' },
      { value: 'TopRight', label: 'Top Right' },
      { value: 'BottomLeft', label: 'Bottom Left' },
      { value: 'BottomRight', label: 'Bottom Right' },
    ],
  },
});