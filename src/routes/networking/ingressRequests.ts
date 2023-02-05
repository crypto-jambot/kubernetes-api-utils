import { coreClient, networkingClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import { makeRequest, removeEmpty } from "../../utils/helperFunctions";
import { V1Ingress, V1IngressSpec } from "@kubernetes/client-node";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";
import * as net from "net";

type IngressBody = {
    secretName: string;
    hostname: string;
    rewriteTarget?: string;
    paths: Path[];
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    isNginx?: boolean;
};
type UpdateBody = {
    spec: V1IngressSpec;
};
type Path = {
    appName: string;
    port: number;
    path: string;
    pathType: string;
};
export const ingressRouter = Router();

createMiddleware(ingressRouter, "ingress");

createPostRequest<V1Ingress, IngressBody>(
    ingressRouter,
    (name, namespace, requestBody) => {
        const {
            secretName,
            hostname,
            paths,
            rewriteTarget,
            labels,
            annotations: incomingAnnotations,
            isNginx,
        } = requestBody;
        let annotations = {
            "nginx.ingress.kubernetes.io/rewrite-target": rewriteTarget ?? "/",
        };
        if (isNginx) {
            annotations = {
                ...annotations,
                ...{ "kubernetes.io/ingress.class": "nginx" },
            };
        }
        const ingressRequest: V1Ingress = {
            apiVersion: "networking.k8s.io/v1",
            metadata: {
                name: name,
                annotations: { ...annotations, ...incomingAnnotations },
                labels,
            },
            spec: {
                rules: [
                    {
                        host: hostname,
                        http: {
                            paths: paths
                                ? paths.map((pathRule) => {
                                      const { port, path, appName, pathType } =
                                          pathRule;
                                      return {
                                          backend: {
                                              service: {
                                                  name: appName,
                                                  port: {
                                                      number: port,
                                                  },
                                              },
                                          },
                                          path,
                                          pathType,
                                      };
                                  })
                                : [],
                        },
                    },
                ],
                tls: [
                    {
                        secretName,
                        hosts: [hostname, `*.${hostname}`],
                    },
                ],
            },
        };
        return networkingClient.createNamespacedIngress(
            namespace,
            removeEmpty(ingressRequest),
            "true"
        );
    }
);

createPutRequest<V1Ingress, UpdateBody>(
    ingressRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.spec = { ...originalRequest, ...requestBody.spec };
        return networkingClient.patchNamespacedIngress(
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

createDeleteRequest(ingressRouter, (name, namespace) => {
    return networkingClient.deleteNamespacedIngress(name, namespace);
});

createGetRequest(ingressRouter, (name, namespace) => {
    return networkingClient.readNamespacedIngress(name, namespace);
});

ingressRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(
                      networkingClient.listIngressForAllNamespaces()
                  )
                : await makeRequest(
                      networkingClient.listNamespacedIngress(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
