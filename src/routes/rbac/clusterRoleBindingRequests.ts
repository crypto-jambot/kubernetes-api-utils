import { rbacClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";
import { V1ClusterRoleBinding, V1Subject } from "@kubernetes/client-node";

export const clusterRoleBindingRouter = Router();
type RoleBindingBody = {
    annotations: Record<string, string>;
    labels: Record<string, string>;
    roleRef: RoleRef;
    subjects: Subject[];
};
type UpdateBody = {
    subjects: Subject[];
};
type RoleRef = {
    name: string;
    kind: string;
};
type Subject = {
    name: string;
    namespace?: string;
    kind: string;
};

createMiddleware(clusterRoleBindingRouter, "cluster role", false);
createPostRequest<V1ClusterRoleBinding, RoleBindingBody>(
    clusterRoleBindingRouter,
    (name, namespace, requestBody) => {
        const {
            annotations,
            labels,
            roleRef: initialRoleRef,
            subjects: initialSubjects,
        } = requestBody;
        const roleRef = { ...initialRoleRef, apiGroup: "" };
        const subjects = initialSubjects.map((subject) => ({
            ...subject,
            apiGroup: "",
        }));
        return rbacClient.createClusterRoleBinding({
            apiVersion: "rbac.authorization.k8s.io/v1",
            metadata: { name, annotations, labels },
            roleRef,
            subjects,
        });
    }
);

createPutRequest<V1ClusterRoleBinding, UpdateBody>(
    clusterRoleBindingRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.subjects = [
            ...(originalRequest.subjects ?? []),
            ...(requestBody.subjects ?? []),
        ];
        return rbacClient.patchClusterRoleBinding(
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

createDeleteRequest(clusterRoleBindingRouter, (name) => {
    return rbacClient.deleteClusterRoleBinding(name, "true");
});

createGetRequest(clusterRoleBindingRouter, (name) => {
    return rbacClient.readClusterRoleBinding(name, "true");
});
