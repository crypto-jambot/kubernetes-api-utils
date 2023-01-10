import * as http from "http";
import { Request, NextFunction } from "express";

export function encode(byteArray: Uint8Array): string {
    return btoa(String.fromCharCode(...byteArray));
}

export function removeEmpty<T extends {}>(obj: T): T {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v != null)
    ) as T;
}

export async function makeRequest<T>(request: Promise<T>) {
    type ResponseType = {
        response: http.IncomingMessage;
        body: T;
    };
    return new Promise<ResponseType>(async (resolve, reject) => {
        try {
            const response = (await request) as ResponseType;
            resolve(response);
        } catch (err: any) {
            console.log(err.statusCode);
            console.log("^^^");
            reject({
                statusCode: err?.statusCode || 403,
                message: err?.body ?? err,
            });
        }
    });
}
// export function middleware(
//     req: Request,
//     resource: string,
//     next: NextFunction,
//     namespace: string | null,
//     name?: string
// ): void {
//     console.log(new Date());
//     if (namespace && name) {
//         // const method = switch(req.method) {} === "POST" ? "Creating" : "Deleting";
//         const method = getMethod(req.method);
//         console.log(
//             `${method} ${name} ${resource} in the ${namespace} namespace.`
//         );
//     } else {
//         const grammar =
//             namespace === "all"
//                 ? "from all namespaces"
//                 : `from the ${namespace} namespace`;
//         console.log(`Getting ${resource} ${grammar}.`);
//     }
//     next();
// }

export function middleware(
    req: Request,
    resource: string,
    next: NextFunction,
    namespace: string | null,
    name?: string
): void {
    console.log(new Date());
    const method = getMethod(req.method);
    if (namespace && name) {
        const message =
            req.method === "GET"
                ? `Getting ${resource}s from the ${name} namespace`
                : `${method} ${name} ${resource} in the ${namespace} namespace.`;
        console.log(message);
    } else {
        const grammar =
            namespace === "all"
                ? "from all namespaces"
                : `from the ${namespace} namespace`;
        console.log(`Getting ${resource}s ${grammar}.`);
    }

    next();
}

function getMethod(requestType: string) {
    switch (requestType) {
        case "POST":
            return "Creating";
        case "DELETE":
            return "Deleting";
        case "GET":
            return "Getting";
    }
}
