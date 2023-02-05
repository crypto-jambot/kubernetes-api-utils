import { rbacClient } from "../../utils/apiClientUtil";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { Router } from "express";
import {
    V1AggregationRule,
    V1ClusterRole,
    V1PolicyRule,
} from "@kubernetes/client-node";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";

export const clusterRoleRouter = Router();
type ClusterRoleBody = {
    rules: Rule[];
    aggregationRule?: AggregationRule;
    annotations: Record<string, string>;
    labels: Record<string, string>;
};

type UpdateBody = {
    aggregationRule?: V1AggregationRule;
    rules?: V1PolicyRule[];
};
type AggregationRule = {
    clusterRoleSelectors: ClusterRoleSelector[];
};
type ClusterRoleSelector = {
    matchLabels: Record<string, string>;
    matchExpressions: MatchExpression[];
};
type MatchExpression = {
    key: string;
    values: string[];
    operator: string;
};
type Rule = {
    apiGroups: string[];
    resources: string[];
    verbs: string[];
    resourceNames?: string[];
    nonResourceURLs?: string[];
};

createMiddleware(clusterRoleRouter, "cluster role", false);

createPostRequest<V1ClusterRole, ClusterRoleBody>(
    clusterRoleRouter,
    (name, namespace, requestBody) => {
        const { rules, aggregationRule, annotations, labels } = requestBody;
        const clusterRoleRequest: V1ClusterRole = {
            apiVersion: "rbac.authorization.k8s.io/v1",
            metadata: {
                name,
                annotations,
                labels,
            },
            aggregationRule,
            rules: [{ apiGroups: [""], verbs: ["*"], resources: [""] }],
        };
        return rbacClient.createClusterRole(
            removeEmpty(clusterRoleRequest),
            "true"
        );
    }
);

createPutRequest<V1ClusterRole, UpdateBody>(
    clusterRoleRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.aggregationRule = {
            ...originalRequest.aggregationRule,
            ...requestBody.aggregationRule,
        };
        return rbacClient.patchClusterRole(
            name,
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

createDeleteRequest(clusterRoleRouter, (name) => {
    return rbacClient.deleteClusterRole(name);
});

createGetRequest(clusterRoleRouter, (name) => {
    return rbacClient.readClusterRole(name, "true");
});
