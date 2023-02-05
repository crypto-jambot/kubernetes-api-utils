import { Router } from "express";
import {
    KubeResponse,
    makeAxiosRequest,
    makeRequest,
    middleware,
} from "./helperFunctions";

export function createMiddleware(
    router: Router,
    resourceType: string,
    hasNamespace: boolean = true
): void {
    router.use("/:name/:namespace?", (req, res, next) => {
        const { name, namespace = "default" } = req.params;
        middleware(
            req,
            resourceType,
            next,
            hasNamespace ? namespace : null,
            name
        );
    });
}

export function createGetRequest<T>(
    router: Router,
    callback: (name: string, namespace: string) => Promise<KubeResponse<T>>
): void {
    router.get("/:name/:namespace?", async (req, res) => {
        const { name, namespace = "default" } = req.params;
        try {
            const { response, body } = await makeRequest(
                callback(name, namespace)
            );
            res.status(response.statusCode as number).json(body);
        } catch (err: any) {
            res.status(err.statusCode).json(err.message);
        }
    });
}

export function createPutRequest<T, U>(
    router: Router,
    callback: (
        name: string,
        namespace: string,
        originalRequest: T,
        requestBody: U
    ) => Promise<KubeResponse<T>>
): void {
    router.put("/:name/:namespace?", async (req, res) => {
        const { name, namespace = "default" } = req.params;
        try {
            const originalRequest = await makeAxiosRequest<T>(
                `${req.protocol}://${req.hostname}:${process.env.PORT || 3000}${
                    req.baseUrl
                }/${name}/${namespace}`,
                "GET",
                { Authorization: req.headers.authorization }
            );
            const { response, body } = await makeRequest(
                callback(name, namespace, originalRequest, req.body)
            );
            res.status(response.statusCode as number).json(body);
        } catch (err: any) {
            res.status(err.statusCode).json(err.message);
        }
    });
}

export function createPostRequest<T, U>(
    router: Router,
    callback: (
        name: string,
        namespace: string,
        requestBody: U
    ) => Promise<KubeResponse<T>>
): void {
    router.post("/:name/:namespace?", async (req, res) => {
        const { name, namespace = "default" } = req.params;
        try {
            const { response, body } = await makeRequest(
                callback(name, namespace, req.body)
            );
            res.status(response.statusCode as number).json(body);
        } catch (err: any) {
            res.status(err.statusCode).json(err.message);
        }
    });
}

export function createDeleteRequest<T>(
    router: Router,
    callback: (name: string, namespace: string) => Promise<KubeResponse<T>>
) {
    router.delete("/:name/:namespace?", async (req, res) => {
        const { name, namespace = "default" } = req.params;
        try {
            const { response, body } = await makeRequest(
                callback(name, namespace)
            );
            res.status(response.statusCode as number).json(body);
        } catch (err: any) {
            res.status(err.statusCode).json(err.message);
        }
    });
}

export const putRequestHeaders = {
    headers: {
        "Content-Type": "application/strategic-merge-patch+json",
    },
};
