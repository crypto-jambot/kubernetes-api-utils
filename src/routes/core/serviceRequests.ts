import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { V1Service, V1ServicePort } from "@kubernetes/client-node";

type ServiceBody = {
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
};

type SessionAffinityConfig = {
    clientIP: ClientIp;
};
type ClientIp = {
    timeoutSeconds: number;
};
export const serviceRouter = Router();

serviceRouter.use("/:name/:namespace?", (req, res, next) => {
    const { name, namespace = "default" } = req.params;
    middleware(req, "service", next, namespace, name);
});

serviceRouter.use("/:namespace?", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    const { namespace = "default" } = req.params;
    middleware(req, "services", next, namespace);
});

serviceRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const {
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
    } = req.body as ServiceBody;

    const serviceRequest: V1Service = {
        apiVersion: "v1",
        metadata: {
            name,
            annotations,
            labels,
        },
        spec: {
            type: "LoadBalancer",
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
            selector: {
                app: name,
            },
            ports,
        },
    };

    try {
        const { response, body } = await makeRequest(
            coreClient.createNamespacedService(
                namespace,
                removeEmpty(serviceRequest)
            )
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

serviceRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            coreClient.deleteNamespacedService(name, namespace)
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

serviceRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(coreClient.listServiceForAllNamespaces())
                : await makeRequest(
                      coreClient.listNamespacedService(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err?.statusCode).json(err?.message);
    }
});
