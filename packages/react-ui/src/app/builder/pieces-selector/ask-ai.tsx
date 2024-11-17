import { AddActionRequest } from "@activepieces/shared"
import { useBuilderStateContext } from "../builder-hooks"
import { Button } from "../../../components/ui/button";
import { t } from "i18next";
import { Sparkle } from "lucide-react";

const AskAiButton = ({
    onClick,
    action
}: {
    onClick: () => void;
    action: Omit<AddActionRequest, 'action'>
}) => {

    const setAskiAiButtonProps = useBuilderStateContext(state => state.setAskAiButtonProps);
    return <Button variant='ghost' size='default' onClick={() => { setAskiAiButtonProps(action); onClick(); }}>
        <div className="flex gap-2 items-center ">
            <Sparkle className='w-4 h-4 stroke-foreground '></Sparkle> {t('Ask AI')}
        </div>
    </Button>
}

AskAiButton.displayName = 'AskAiButton';
export { AskAiButton };