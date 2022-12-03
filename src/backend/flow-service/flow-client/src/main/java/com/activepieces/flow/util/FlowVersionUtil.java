package com.activepieces.flow.util;

import com.activepieces.actions.model.action.ActionMetadataView;
import com.activepieces.actions.model.action.CodeActionMetadataView;
import com.activepieces.actions.model.action.ComponentActionMetadataView;
import com.activepieces.actions.model.action.LoopOnItemsActionMetadataView;
import com.activepieces.common.code.ArtifactMetadata;
import com.activepieces.flow.model.FlowVersionView;
import lombok.experimental.UtilityClass;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@UtilityClass
public class FlowVersionUtil {

    public static List<ArtifactMetadata> findAllStepsWithArtifact(FlowVersionView flowVersionView) {
        return findAllActions(flowVersionView).stream()
                .filter(f -> f instanceof ArtifactMetadata)
                .map(f -> (ArtifactMetadata) f)
                .collect(Collectors.toList());
    }
    public static List<ComponentActionMetadataView> findComponentActions(FlowVersionView flowVersionView) {
        return findAllActions(flowVersionView).stream()
                .filter(f -> f instanceof ComponentActionMetadataView)
                .map(f -> (ComponentActionMetadataView) f)
                .collect(Collectors.toList());
    }

    public static List<CodeActionMetadataView> findCodeActions(FlowVersionView flowVersionView) {
        return findAllActions(flowVersionView).stream()
                .filter(f -> f instanceof CodeActionMetadataView)
                .map(f -> (CodeActionMetadataView) f)
                .collect(Collectors.toList());
    }

    public static List<ActionMetadataView> findAllActions(FlowVersionView flowVersionView) {
        List<ActionMetadataView> actions = new ArrayList<>();
        if (Objects.nonNull(flowVersionView.getTrigger())) {
            actions = traverseAction(flowVersionView.getTrigger().getNextAction());
        }
        return actions;
    }

    public static List<ActionMetadataView> traverseAction(ActionMetadataView actionMetadataView) {
        if (Objects.isNull(actionMetadataView)) {
            return Collections.emptyList();
        }
        List<ActionMetadataView> actions = new ArrayList<>();
        actions.add(actionMetadataView);
        actions.addAll(traverseAction(actionMetadataView.getNextAction()));
        if (actionMetadataView instanceof LoopOnItemsActionMetadataView) {
            LoopOnItemsActionMetadataView loopOnItemsActionMetadataView =
                    (LoopOnItemsActionMetadataView) actionMetadataView;
            actions.addAll(traverseAction(loopOnItemsActionMetadataView.getFirstLoopAction()));
        }
        return actions;
    }

}
