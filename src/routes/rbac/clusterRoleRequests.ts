import { rbacClient } from "../../utils/apiClientUtil";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { Router } from "express";
import { V1ClusterRole } from "@kubernetes/client-node";

export const clusterRoleRouter = Router();
type ClusterRoleBody = {
    rules: Rule[];
    aggregationRule?: AggregationRule;
    annotations: Record<string, string>;
    labels: Record<string, string>;
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

clusterRoleRouter.use("/:name", (req, res, next) => {
    const { name } = req.params;
    const method = req.method === "POST" ? "Creating" : "Deleting";
    console.log(new Date());
    console.log(`${method} ${name} cluster role`);
    next();
});

clusterRoleRouter.use("/", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    console.log(new Date());
    console.log("Getting cluster roles");
    next();
});

clusterRoleRouter.post("/:name", async (req, res) => {
    const { name } = req.params;
    const { rules, aggregationRule, annotations, labels } =
        req.body as ClusterRoleBody;
    try {
        const clusterRoleRequest: V1ClusterRole = {
            apiVersion: "rbac.authorization.k8s.io/v1",
            metadata: {
                name,
                annotations,
                labels,
            },
            aggregationRule,
            rules,
        };
        const { response, body } = await makeRequest(
            rbacClient.createClusterRole(
                removeEmpty(clusterRoleRequest),
                "true"
            )
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

clusterRoleRouter.delete("/:name", async (req, res) => {
    const { name } = req.params;
    try {
        const { response, body } = await makeRequest(
            rbacClient.deleteClusterRole(name, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.body);
    }
});

clusterRoleRouter.get("/", async (req, res) => {
    try {
        const { response, body } = await makeRequest(
            rbacClient.listClusterRole("true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
