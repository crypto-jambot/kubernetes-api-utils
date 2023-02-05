import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import { makeRequest, removeEmpty } from "../../utils/helperFunctions";
import {
    V1LocalObjectReference,
    V1ObjectReference,
    V1ServiceAccount,
} from "@kubernetes/client-node";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
} from "../../utils/routerUtils";

export const serviceAccountRouter = Router();

type ServiceAccountBody = {
    automountServiceAccountToken?: boolean;
    secrets?: V1ObjectReference[];
    imagePullSecrets: V1LocalObjectReference[];
};

createMiddleware(serviceAccountRouter, "service account");

createPostRequest<V1ServiceAccount, ServiceAccountBody>(
    serviceAccountRouter,
    (name, namespace, requestBody) => {
        const { secrets, imagePullSecrets, automountServiceAccountToken } =
            requestBody;
        const serviceAccountRequest: V1ServiceAccount = {
            apiVersion: "v1",
            metadata: {
                name,
            },
            automountServiceAccountToken,
            secrets,
            imagePullSecrets,
        };
        return coreClient.createNamespacedServiceAccount(
            namespace,
            removeEmpty(serviceAccountRequest)
        );
    }
);

createDeleteRequest(serviceAccountRouter, (name, namespace) => {
    return coreClient.deleteNamespacedServiceAccount(name, namespace);
});

createGetRequest(serviceAccountRouter, (name, namespace) => {
    return coreClient.readNamespacedServiceAccount(name, namespace, "true");
});

//Request for getting access token for dashboard
serviceAccountRouter.get("/", async (req, res) => {
    try {
        const { response, body } = await makeRequest(
            coreClient.createNamespacedServiceAccountToken(
                "default",
                "default",
                {
                    spec: {
                        audiences: [],
                    },
                }
            )
        );
        res.status(response.statusCode as number).json({
            token: body.status?.token,
        });
    } catch (err: any) {
        console.log(err);
        res.status(err.statusCode).json(err.message);
    }
});
