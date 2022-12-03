package com.activepieces.entity.enums;

public enum ResourceType {
   PROJECT(true),
   API_KEY(false),
   FLOW(false),
   FLOW_VERSION(false),
   INSTANCE(false),
   COLLECTION_VERSION(false),
   COLLECTION(false),
   INSTANCE_RUN(false);

   private final boolean mainResource;

   ResourceType(boolean mainResource){
      this.mainResource = mainResource;
   }

   public boolean isMainResource(){
      return this.mainResource;
   }
}
