import {
    encode,
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { coreClient } from "../../utils/apiClientUtil";
import { SecretUtil } from "@crypto-jambot/secret-manager-utils";
import { Router } from "express";
export const secretRouter = Router();

type SecretBody = {
    secretCertKey: string;
    secretPrivateKey: string;
    stringData?: Record<string, string>;
    immutable?: boolean;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
};
const privateKeyUtil = new SecretUtil();
const publicKeyUtil = new SecretUtil();

secretRouter.use("/:name/:namespace?", (req, res, next) => {
    const { name, namespace = "default" } = req.params;
    middleware(req, "secret", next, namespace, name);
});

secretRouter.use("/:namespace?", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    const { namespace = "default" } = req.params;
    middleware(req, "secrets", next, namespace);
});

secretRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const {
        secretCertKey,
        secretPrivateKey,
        stringData,
        immutable,
        annotations,
        labels,
    } = req.body as SecretBody;
    try {
        const privateKey = encode(
            (await privateKeyUtil.getSecretPayload(
                secretPrivateKey
            )) as Uint8Array
        );
        const publicKey = encode(
            (await publicKeyUtil.getSecretPayload(secretCertKey)) as Uint8Array
        );
        const secretRequest = {
            apiVersion: "v1",
            metadata: {
                name,
                annotations,
                labels,
            },
            stringData,
            immutable,
            type: "kubernetes.io/tls",
            data: {
                "tls.crt": publicKey,
                "tls.key": privateKey,
            },
        };
        const { response, body } = await makeRequest(
            coreClient.createNamespacedSecret(
                namespace,
                removeEmpty(secretRequest)
            )
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

secretRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            coreClient.deleteNamespacedSecret(name, namespace)
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

secretRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(coreClient.listSecretForAllNamespaces())
                : await makeRequest(
                      coreClient.listNamespacedSecret(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
