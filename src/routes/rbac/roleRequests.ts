import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { rbacClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import { V1Role } from "@kubernetes/client-node";

export const roleRouter = Router();
type RoleBody = {
    rules: Rule[];
    annotations: Record<string, string>;
    labels: Record<string, string>;
};
type Rule = {
    apiGroups: string[];
    resources: string[];
    verbs: string[];
    resourceNames?: string[];
    nonResourceURLs?: string[];
};

roleRouter.use("/:name/:namespace?", (req, res, next) => {
    const { name, namespace = "default" } = req.params;
    middleware(req, "role", next, namespace, name);
});

roleRouter.use("/:namespace?", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    const { namespace = "default" } = req.params;
    middleware(req, "roles", next, namespace);
});

roleRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const { rules, annotations, labels } = req.body as RoleBody;
    try {
        const roleRequest: V1Role = {
            apiVersion: "rbac.authorization.k8s.io/v1",
            metadata: {
                name,
                annotations,
                labels,
            },
            rules,
        };
        const { response, body } = await makeRequest(
            rbacClient.createNamespacedRole(namespace, removeEmpty(roleRequest))
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

roleRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            rbacClient.deleteNamespacedRole(name, namespace, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

roleRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(rbacClient.listRoleForAllNamespaces())
                : await makeRequest(
                      rbacClient.listNamespacedRole(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
