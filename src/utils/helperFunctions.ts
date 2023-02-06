import { IncomingMessage, IncomingHttpHeaders } from "http";
import { Request, NextFunction, Response } from "express";
import axios, { AxiosRequestConfig, Method } from "axios";
import { verify } from "jsonwebtoken";
import { SecretUtil } from "@crypto-jambot/secret-manager-utils";

const secretUtil = new SecretUtil();
export function encode(byteArray: Uint8Array): string {
    return btoa(String.fromCharCode(...byteArray));
}

export function removeEmpty<T extends {}>(object: T): T {
    Object.entries(object).forEach(([k, v]) => {
        if (v && typeof v === "object") {
            removeEmpty(v);
        }
        if (
            (v && typeof v === "object" && !Object.keys(v).length) ||
            v === null ||
            v === undefined
        ) {
            if (Array.isArray(object)) {
                object.splice(parseInt(k), 1);
            } else {
                // @ts-ignore
                delete object[k];
            }
        }
    });
    return object;
}

export type KubeResponse<T> = {
    response: IncomingMessage;
    body: T;
};

export async function makeRequest<T>(
    request: Promise<KubeResponse<T>>
): Promise<KubeResponse<T>> {
    return new Promise<KubeResponse<T>>(async (resolve, reject) => {
        try {
            const response = await request;
            resolve(response);
        } catch (err: any) {
            reject({
                statusCode: err?.statusCode || 403,
                message: err?.body ?? err,
            });
        }
    });
}
export function middleware(
    req: Request,
    resource: string,
    next: NextFunction,
    namespace: string | null,
    name: string
): void {
    console.log(new Date());
    const method = getMethod(req.method);
    const resourceLog = `${method} ${name} ${resource}`;
    if (!namespace) {
        console.log(`${resourceLog}${name === "all" ? "s" : ""}`);
    } else {
        console.log(`${resourceLog} in the ${namespace} namespace.`);
    }
    next();
}

function getMethod(requestType: string) {
    switch (requestType) {
        case "POST":
            return "Creating";
        case "DELETE":
            return "Deleting";
        case "PUT":
            return "Updating";
        case "GET":
            return "Reading";
    }
}

export function makeAxiosRequest<T>(
    url: string,
    method: Method | string,
    headers?: IncomingHttpHeaders,
    body?: any
): Promise<T> {
    const defaultHeaders = {
        "Content-Type": "application/json",
    };
    const config: AxiosRequestConfig = {
        url,
        method,
        headers: { ...defaultHeaders, ...headers },
        data: JSON.stringify(body),
    };
    return new Promise<T>(async (resolve, reject) => {
        try {
            const { data } = await axios.request<T>(config);
            resolve(data);
        } catch (err: any) {
            const { data } = err.response;
            reject({
                message: data ?? err,
                statusCode: data.code || 400,
            });
        }
    });
}

export async function runAuth(
    authHeader: string | undefined,
    next: NextFunction,
    res: Response
) {
    const token = authHeader && authHeader.split(" ")[1];
    if (!!token) {
        try {
            const publicKey: string = await secretUtil.getSecretString(
                "besu-public-key"
            );
            verify(token, publicKey);
            next();
        } catch (err: any) {
            const { message } = err;
            res.status(401).json({
                message: message ?? "Failure to Authenticate",
            });
        }
        return;
    }
    res.status(400).json({
        message: "Missing Authorization Header or it is formatted incorrectly",
    });
}
