import { ControllerRenderProps } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';
import { JsonEditor } from '@/components/custom/json-editor';

interface BuilderJsonEditorWrapperProps {
  field: ControllerRenderProps<Record<string, any>, string>;
  disabled?: boolean;
}

const BuilderJsonEditorWrapper = ({
  field,
  disabled,
}: BuilderJsonEditorWrapperProps) => {
  const [setInsertStateHandler] = useBuilderStateContext((state) => [
    state.setInsertMentionHandler,
  ]);

  return (
    <JsonEditor
      field={field}
      readonly={disabled ?? false}
      onFocus={(ref) => {
        setInsertStateHandler((propertyPath) => {
          ref.current?.view?.dispatch({
            changes: {
              from: ref.current.view.state.selection.main.head,
              insert: `{{${propertyPath}}}`,
            },
          });
        });
      }}
      className={textMentionUtils.inputWithMentionsCssClass}
    />
  );
};

BuilderJsonEditorWrapper.displayName = 'BuilderJsonEditorWrapper';
export { BuilderJsonEditorWrapper };
