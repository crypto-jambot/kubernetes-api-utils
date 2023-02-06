import { encode, removeEmpty } from "../../utils/helperFunctions";
import { coreClient } from "../../utils/apiClientUtil";
import { SecretUtil } from "@crypto-jambot/secret-manager-utils";
import { Router } from "express";
import { V1Secret } from "@kubernetes/client-node";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
} from "../../utils/routerUtils";
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
createMiddleware(secretRouter, "secret");

createPostRequest<V1Secret, SecretBody>(
    secretRouter,
    async (name, namespace, requestBody) => {
        const {
            secretCertKey,
            secretPrivateKey,
            stringData,
            immutable,
            annotations,
            labels,
        } = requestBody;
        const privateKey = encode(
            (await privateKeyUtil.getSecretPayload(
                secretPrivateKey
            )) as Uint8Array
        );
        const publicKey = encode(
            (await publicKeyUtil.getSecretPayload(secretCertKey)) as Uint8Array
        );
        const secretRequest: V1Secret = {
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
        return coreClient.createNamespacedSecret(
            namespace,
            removeEmpty(secretRequest),
            "true"
        );
    }
);

createDeleteRequest(secretRouter, (name, namespace) => {
    return coreClient.deleteNamespacedSecret(name, namespace, "true");
});

createGetRequest(secretRouter, (name, namespace) => {
    return coreClient.readNamespacedSecret(name, namespace, "true");
});
