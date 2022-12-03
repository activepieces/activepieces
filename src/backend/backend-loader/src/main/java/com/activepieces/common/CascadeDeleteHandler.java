package com.activepieces.common;

import com.activepieces.apikey.server.repository.ApiKeyRepository;
import com.activepieces.entity.enums.InstanceStatus;
import com.activepieces.entity.nosql.Instance;
import com.activepieces.entity.sql.Resource;
import com.activepieces.flow.repository.FlowRepository;
import com.activepieces.flow.repository.FlowVersionRepository;
import com.activepieces.guardian.client.ResourceSubscriber;
import com.activepieces.guardian.client.model.ResourceEventType;
import com.activepieces.instance.server.repository.InstanceRepository;
import com.activepieces.piece.server.repository.CollectionRepository;
import com.activepieces.piece.server.repository.CollectionVersionRepository;
import com.activepieces.project.server.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CascadeDeleteHandler implements ResourceSubscriber {

    private final ApiKeyRepository apiKeyRepository;
    private final ProjectRepository projectRepository;
    private final InstanceRepository instanceRepository;
    private final FlowRepository flowRepository;
    private final CollectionRepository collectionRepository;
    private final FlowVersionRepository flowVersionRepository;
    private final CollectionVersionRepository collectionVersionRepository;

    @Autowired
    public CascadeDeleteHandler(CollectionVersionRepository collectionVersionRepository, FlowVersionRepository flowVersionRepository,
                                ApiKeyRepository apiKeyRepository, ProjectRepository projectRepository, InstanceRepository instanceRepository, FlowRepository flowRepository, CollectionRepository collectionRepository) {
        this.collectionVersionRepository = collectionVersionRepository;
        this.flowVersionRepository = flowVersionRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.projectRepository = projectRepository;
        this.instanceRepository = instanceRepository;
        this.flowRepository = flowRepository;
        this.collectionRepository = collectionRepository;
    }

    @Override
    public void onListen(ResourceEventType type, Resource entity) {
        if(type.equals(ResourceEventType.DELETE)) {
            switch (entity.getResourceType()) {
                case API_KEY:
                    apiKeyRepository.deleteById(entity.getResourceId());
                    break;
                case PROJECT:
                    projectRepository.deleteById(entity.getResourceId());
                    break;
                case INSTANCE:
                     Instance instance = instanceRepository.findById(entity.getResourceId()).orElseThrow();
                     // TODO HARD DELETE
                     //  instance.setStatus(InstanceStatus.ARCHIVED);
                     instanceRepository.save(instance);
                    break;
                case FLOW:
                    flowRepository.deleteById(entity.getResourceId());
                    break;
                case COLLECTION:
                    collectionRepository.deleteById(entity.getResourceId());
                    break;
                case FLOW_VERSION:
                    flowVersionRepository.deleteById(entity.getResourceId());
                    break;
                case COLLECTION_VERSION:
                    collectionVersionRepository.deleteById(entity.getResourceId());
                    break;
            }
        }
    }
}
