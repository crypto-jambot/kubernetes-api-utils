import { networkingClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    makeRequest,
    middleware,
    removeEmpty,
} from "../../utils/helperFunctions";
import { V1Ingress } from "@kubernetes/client-node";

type IngressBody = {
    secretName: string;
    hostname: string;
    rewriteTarget?: string;
    paths: Path[];
    labels?: Record<string, string>;
};
type Path = {
    appName: string;
    port: number;
    path: string;
    pathType: string;
    keepPath: boolean;
};
export const ingressRouter = Router();

// ingressRouter.use("/:name/:namespace?", (req, res, next) => {
//     const { name, namespace = "default" } = req.params;
//     middleware(req, "ingress", next, namespace, name);
// });
//
// ingressRouter.use("/:namespace?", (req, res, next) => {
//     if (req.method !== "GET") {
//         next();
//         return;
//     }
//     const { namespace = "default" } = req.params;
//     middleware(req, "ingresses", next, namespace);
// });

ingressRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const { secretName, hostname, paths, rewriteTarget, labels } =
        req.body as IngressBody;
    try {
        const ingressRequest: V1Ingress = {
            apiVersion: "networking.k8s.io/v1",
            metadata: {
                name: name,
                annotations: {
                    "kubernetes.io/ingress.class": "nginx",
                    "nginx.ingress.kubernetes.io/rewrite-target":
                        rewriteTarget ?? "/", //This is the regex pattern for your url
                },
                labels,
            },
            spec: {
                rules: [
                    {
                        host: hostname,
                        http: {
                            paths: paths.map((pathRule) => {
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
                            }),
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
        console.log(removeEmpty(ingressRequest));
        const { response, body } = await makeRequest(
            networkingClient.createNamespacedIngress(
                namespace,
                removeEmpty(ingressRequest)
            )
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

ingressRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            networkingClient.deleteNamespacedIngress(name, namespace, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
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
