import { coreClient } from "../../utils/apiClientUtil";
import { V1ConfigMap } from "@kubernetes/client-node";
import { Router } from "express";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";
import { removeEmpty } from "../../utils/helperFunctions";

export const configMapRouter = Router();
type ConfigMapBody = {
    data?: Record<string, string>;
    immutable?: boolean;
    binaryData?: Record<string, string>;
};
type UpdateConfigMap = {
    data?: Record<string, string>;
    binaryData?: Record<string, string>;
    immutable?: boolean;
};

createMiddleware(configMapRouter, "configMap");

createPostRequest<V1ConfigMap, ConfigMapBody>(
    configMapRouter,
    (name, namespace, requestBody) => {
        const { data, immutable, binaryData } = requestBody;
        const configMapRequest: V1ConfigMap = {
            apiVersion: "v1",
            metadata: {
                name,
            },
            data,
            immutable,
            binaryData,
        };
        return coreClient.createNamespacedConfigMap(
            namespace,
            removeEmpty(configMapRequest),
            "true"
        );
    }
);

createPutRequest<V1ConfigMap, UpdateConfigMap>(
    configMapRouter,
    (name, namespace, originalRequest, requestBody) => {
        return coreClient.patchNamespacedConfigMap(
            name,
            namespace,
            {
                ...originalRequest,
                ...requestBody,
            },
            "true",
            undefined,
            undefined,
            undefined,
            undefined,
            putRequestHeaders
        );
    }
);
createDeleteRequest(configMapRouter, (name, namespace) => {
    return coreClient.deleteNamespacedConfigMap(name, namespace, "true");
});

createGetRequest(configMapRouter, (name, namespace) => {
    return coreClient.readNamespacedConfigMap(name, namespace, "true");
});
