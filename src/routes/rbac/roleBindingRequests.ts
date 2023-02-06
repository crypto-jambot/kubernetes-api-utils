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
import { V1RoleBinding } from "@kubernetes/client-node";
export const roleBindingRouter = Router();

type RoleBindingBody = {
    subjects: Subject[];
    roleRef: RoleRef;
};
type UpdateBody = {
    subjects: Subject[];
};
type Subject = {
    name: string;
    kind: string;
    namespace?: string;
};
type RoleRef = {
    name: string;
    kind: string;
};

createMiddleware(roleBindingRouter, "role binding");

createPostRequest<V1RoleBinding, RoleBindingBody>(
    roleBindingRouter,
    (name, namespace, requestBody) => {
        const { subjects: initialSubjects, roleRef: initialRoleRef } =
            requestBody;
        // const authorizationNameGroup = "rbac.authorization.k8s.io";
        const authorizationNameGroup = "";
        const subjects = initialSubjects.map((subject) => ({
            ...subject,
            apiGroup: authorizationNameGroup,
        }));
        const roleRef = {
            ...initialRoleRef,
            apiGroup: authorizationNameGroup,
        };
        return rbacClient.createNamespacedRoleBinding(namespace, {
            apiVersion: "rbac.authorization.k8s.io/v1",
            metadata: {
                name,
            },
            subjects,
            roleRef,
        });
    }
);

createPutRequest<V1RoleBinding, UpdateBody>(
    roleBindingRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.subjects = [
            ...(originalRequest.subjects ?? []),
            ...(requestBody.subjects ?? []),
        ];
        return rbacClient.patchNamespacedRoleBinding(
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

createDeleteRequest(roleBindingRouter, (name, namespace) => {
    return rbacClient.deleteNamespacedRoleBinding(name, namespace, "true");
});

createGetRequest(roleBindingRouter, (name, namespace) => {
    return rbacClient.readNamespacedRoleBinding(name, namespace, "true");
});
