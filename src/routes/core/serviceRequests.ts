import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import {
    V1Service,
    V1ServicePort,
    V1ServiceSpec,
} from "@kubernetes/client-node";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";

type ServiceBody = {
    type?: string;
    ports: V1ServicePort[];
    externalIPs?: string[];
    loadBalancerIP?: string;
    clusterIP?: string;
    loadBalancerSourceRanges?: string[];
    healthCheckNodePort?: number;
    sessionAffinity?: string;
    externalTrafficPolicy?: string;
    clusterIPs?: string[];
    externalName?: string;
    allocateLoadBalancerNodePorts?: boolean;
    ipFamilies?: string[];
    ipFamilyPolicy?: string;
    loadBalancerClass?: string;
    internalTrafficPolicy?: string;
    sessionAffinityConfig?: SessionAffinityConfig;
    publishNotReadyAddresses?: boolean;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    selectorLabels?: Record<string, string>;
};
type UpdateBody = {
    spec: V1ServiceSpec;
};
type SessionAffinityConfig = {
    clientIP: ClientIp;
};
type ClientIp = {
    timeoutSeconds: number;
};
export const serviceRouter = Router();

createMiddleware(serviceRouter, "service");

createPostRequest<V1Service, ServiceBody>(
    serviceRouter,
    (name, namespace, requestBody) => {
        const {
            type = "LoadBalancer",
            ports,
            externalIPs,
            loadBalancerIP,
            clusterIP,
            loadBalancerSourceRanges,
            healthCheckNodePort,
            sessionAffinity,
            externalTrafficPolicy,
            clusterIPs,
            externalName,
            allocateLoadBalancerNodePorts,
            ipFamilies,
            ipFamilyPolicy,
            loadBalancerClass,
            internalTrafficPolicy,
            sessionAffinityConfig,
            publishNotReadyAddresses,
            annotations,
            labels,
            selectorLabels = { app: name },
        } = requestBody;
        const serviceRequest: V1Service = {
            apiVersion: "v1",
            metadata: {
                name,
                annotations,
                labels,
            },
            spec: {
                type,
                externalIPs,
                loadBalancerIP,
                clusterIP,
                loadBalancerSourceRanges,
                healthCheckNodePort,
                sessionAffinity,
                externalTrafficPolicy,
                clusterIPs,
                externalName,
                allocateLoadBalancerNodePorts,
                ipFamilies,
                ipFamilyPolicy,
                loadBalancerClass,
                internalTrafficPolicy,
                sessionAffinityConfig,
                publishNotReadyAddresses,
                selector: selectorLabels,
                ports,
            },
        };
        return coreClient.createNamespacedService(
            namespace,
            removeEmpty(serviceRequest)
        );
    }
);

createPutRequest<V1Service, UpdateBody>(
    serviceRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.spec = { ...originalRequest.spec, ...requestBody.spec };
        return coreClient.patchNamespacedService(
            name,
            namespace,
            originalRequest,
            "true",
            undefined,
            undefined,
            undefined,
            undefined,
            putRequestHeaders
        );
    }
);

createDeleteRequest(serviceRouter, (name, namespace) => {
    return coreClient.deleteNamespacedService(name, namespace, "true");
});

createGetRequest(serviceRouter, (namespace, name) => {
    return coreClient.readNamespacedService(name, namespace);
});
