import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { V1ServiceAccount } from "@kubernetes/client-node";

export const serviceAccountRouter = Router();

type ServiceAccountBody = {
    automountServiceAccountToken?: boolean;
    secrets?: Secret[];
    imagePullSecrets: ImagePullSecret[];
};
type Secret = {
    name: string;
    namespace: string;
    apiVersion: string;
    kind: string;
    uid: string;
    fieldPath: string;
    resourceVersion: string;
};
type ImagePullSecret = {
    name: string;
};

serviceAccountRouter.use("/:name/:namespace?", (req, res, next) => {
    const { name, namespace = "default" } = req.params;
    middleware(req, "service account", next, namespace, name);
});

serviceAccountRouter.use("/:namespace?", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    const { namespace = "default" } = req.params;
    middleware(req, "service accounts", next, namespace);
});

serviceAccountRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const { secrets, imagePullSecrets, automountServiceAccountToken } =
        req.body as ServiceAccountBody;
    try {
        const serviceAccountRequest: V1ServiceAccount = {
            apiVersion: "v1",
            metadata: {
                name,
            },
            automountServiceAccountToken,
            secrets,
            imagePullSecrets,
        };
        const { response, body } = await makeRequest(
            coreClient.createNamespacedServiceAccount(
                namespace,
                removeEmpty(serviceAccountRequest)
            )
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

serviceAccountRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            coreClient.deleteNamespacedServiceAccount(name, namespace, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

serviceAccountRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(
                      coreClient.listServiceAccountForAllNamespaces()
                  )
                : await makeRequest(
                      coreClient.listNamespacedServiceAccount(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
