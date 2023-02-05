import {
    KubeConfig,
    CoreV1Api,
    NetworkingV1Api,
    StorageV1Api,
    AppsV1Api,
    RbacAuthorizationV1Api,
    AutoscalingV2Api,
} from "@kubernetes/client-node";

const config = new KubeConfig();
config.loadFromDefault();

export const coreClient = config.makeApiClient(CoreV1Api);
export const networkingClient = config.makeApiClient(NetworkingV1Api);
export const storageClient = config.makeApiClient(StorageV1Api);
export const appClient = config.makeApiClient(AppsV1Api);
export const rbacClient = config.makeApiClient(RbacAuthorizationV1Api);
export const autoscalingClient = config.makeApiClient(AutoscalingV2Api);
