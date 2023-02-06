import { appClient } from "../../utils/apiClientUtil";
import {
    V1Container,
    V1Deployment,
    V1DeploymentSpec,
    V1Volume,
} from "@kubernetes/client-node";

import { Router } from "express";
import { removeEmpty } from "../../utils/helperFunctions";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";

type DeploymentBody = {
    replicas: number;
    serviceAccount?: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    containers: V1Container[];
    volumes?: V1Volume[];
    selectorLabels?: Record<string, string>;
};

type UpdateBody = {
    spec: V1DeploymentSpec;
};

export const deploymentRouter = Router();

createMiddleware(deploymentRouter, "deployment");

createPostRequest<V1Deployment, DeploymentBody>(
    deploymentRouter,
    (name, namespace, requestBody) => {
        const {
            replicas,
            serviceAccount,
            annotations,
            labels,
            containers,
            volumes,
            selectorLabels = { app: name },
        } = requestBody;
        const deploymentRequest: V1Deployment = {
            apiVersion: "apps/v1",
            metadata: { name, annotations, labels },
            spec: {
                replicas,
                selector: {
                    matchLabels: selectorLabels,
                },
                template: {
                    metadata: {
                        labels: selectorLabels,
                    },
                    spec: {
                        serviceAccount,
                        containers,
                        volumes,
                    },
                },
            },
        };
        return appClient.createNamespacedDeployment(
            namespace,
            removeEmpty(deploymentRequest),
            "true"
        );
    }
);
createPutRequest<V1Deployment, UpdateBody>(
    deploymentRouter,
    async (name, namespace, originalRequest, requestBody) => {
        originalRequest.spec = {
            ...originalRequest.spec,
            ...requestBody.spec,
        };
        return appClient.patchNamespacedDeployment(
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
createDeleteRequest(deploymentRouter, (name, namespace) => {
    return appClient.deleteNamespacedDeployment(name, namespace, "true");
});
createGetRequest(deploymentRouter, (name, namespace) => {
    return appClient.readNamespacedDeployment(name, namespace, "true");
});
