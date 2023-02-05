import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
} from "../../utils/routerUtils";
import { V1Namespace, V1NamespaceList } from "@kubernetes/client-node";

export const nameSpaceRouter = Router();

createMiddleware(nameSpaceRouter, "namespace", false);

createPostRequest(nameSpaceRouter, (name) => {
    return coreClient.createNamespace({
        apiVersion: "v1",
        metadata: { name },
    });
});

createDeleteRequest(nameSpaceRouter, (name) => {
    return coreClient.deleteNamespace(name, "true");
});

createGetRequest<V1Namespace | V1NamespaceList>(nameSpaceRouter, (name) => {
    if (name === "all") {
        return coreClient.listNamespace("true");
    }
    return coreClient.readNamespace(name);
});
