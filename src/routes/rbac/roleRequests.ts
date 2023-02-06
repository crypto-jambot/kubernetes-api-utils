import { removeEmpty } from "../../utils/helperFunctions";
import { rbacClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import { V1PolicyRule, V1Role } from "@kubernetes/client-node";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";

export const roleRouter = Router();
type RoleBody = {
    rules: Rule[];
    annotations: Record<string, string>;
    labels: Record<string, string>;
};
type UpdateBody = {
    rules: V1PolicyRule[];
};
type Rule = {
    apiGroups: string[];
    resources: string[];
    verbs: string[];
    resourceNames?: string[];
    nonResourceURLs?: string[];
};

createMiddleware(roleRouter, "role");

createPostRequest<V1Role, RoleBody>(
    roleRouter,
    async (name, namespace, requestBody) => {
        const { rules, annotations, labels } = requestBody;
        const awaited = (await rbacClient.readNamespacedRole(name, namespace))
            .body;
        const roleRequest: V1Role = {
            apiVersion: "rbac.authorization.k8s.io/v1",
            metadata: {
                name,
                annotations,
                labels,
            },
            rules,
        };
        return rbacClient.createNamespacedRole(
            namespace,
            removeEmpty(roleRequest)
        );
    }
);

createPutRequest<V1Role, UpdateBody>(
    roleRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.rules = [
            ...(originalRequest.rules ?? []),
            ...(requestBody.rules ?? []),
        ];
        return rbacClient.patchNamespacedRole(
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

createDeleteRequest(roleRouter, (name, namespace) => {
    return rbacClient.deleteNamespacedRole(name, namespace, "true");
});

createGetRequest(roleRouter, (name, namespace) => {
    return rbacClient.readNamespacedRole(name, namespace, "true");
});
