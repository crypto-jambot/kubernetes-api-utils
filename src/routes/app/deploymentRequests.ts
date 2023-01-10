import { appClient } from "../../utils/apiClientUtil";
import { V1Container, V1Deployment, V1Volume } from "@kubernetes/client-node";
import { Router } from "express";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";

type DeploymentBody = {
    replicas: number;
    imageVersion: string;
    serviceAccount?: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    containers: V1Container[];
    volumes: V1Volume[];
};

export const deploymentRouter = Router();

deploymentRouter.use("/:name?/:namespace?", (req, res, next) => {
    const { name, namespace = "default" } = req.params;
    middleware(req, "deployment", next, namespace, name);
});

deploymentRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const {
        replicas,
        serviceAccount,
        annotations,
        labels,
        containers,
        volumes,
    } = req.body as DeploymentBody;
    try {
        const deploymentRequest: V1Deployment = {
            apiVersion: "apps/v1",
            metadata: { name, annotations, labels },
            spec: {
                replicas,
                selector: {
                    matchLabels: {
                        app: name,
                    },
                },
                template: {
                    metadata: {
                        labels: {
                            app: name,
                        },
                    },
                    spec: {
                        containers,
                        serviceAccount,
                        volumes,
                    },
                },
            },
        };
        const { response, body } = await makeRequest(
            appClient.createNamespacedDeployment(
                namespace,
                removeEmpty(deploymentRequest),
                "true"
            )
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

deploymentRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            appClient.deleteNamespacedDeployment(name, namespace, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

deploymentRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(appClient.listDeploymentForAllNamespaces())
                : await makeRequest(
                      appClient.listNamespacedDeployment(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
