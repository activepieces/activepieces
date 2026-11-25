---
id: helm-chart-0-5-0-uses-the-cluster-s-default-storageclass
title: "Helm chart 0.5.0 uses the cluster's default StorageClass again"
added: '2026-10-05'
release: 0.93.0
---

Earlier charts put the cache volume on the `local-path` StorageClass when `persistence.storageClassName` was unset. Chart 0.5.0 uses the cluster's default StorageClass instead. A StatefulSet's volume class cannot change after creation.

#### What you need to do

This applies if your cache volume uses `local-path` (check with `kubectl get pvc`), you never set `persistence.storageClassName`, and you deploy by rendering the chart without a cluster connection (Argo CD, `helm template | kubectl apply`). Pin the class before upgrading, or every sync fails with `updates to statefulset spec ... are forbidden`:

```yaml
persistence:
  storageClassName: "local-path"
```

A direct `helm upgrade` needs no change.
