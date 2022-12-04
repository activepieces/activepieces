package com.activepieces.entity.enums;

public enum ResourceType {
   PROJECT("proj",true),
   FLOW("flow",false),
   FLOW_VERSION("flow_ver", false),
   INSTANCE("inst",false),
   COLLECTION_VERSION("coll_ver",false),
   COLLECTION("coll",false),
   INSTANCE_RUN("run",false);

   private final boolean mainResource;
   private final String prefix;

   ResourceType(String prefix,
                boolean mainResource){
      this.prefix = prefix;
      this.mainResource = mainResource;
   }

   public String getPrefix(){
      return prefix;
   }
}
