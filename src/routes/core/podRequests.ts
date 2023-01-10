import { makeRequest, middleware } from "../../utils/helperFunctions";
import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";

export const podRouter = Router();

podRouter.use("/:namespace?", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    const { namespace = "default" } = req.params;
    middleware(req, "pods", next, namespace);
});

podRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(coreClient.listPodForAllNamespaces())
                : await makeRequest(
                      coreClient.listNamespacedPod(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
