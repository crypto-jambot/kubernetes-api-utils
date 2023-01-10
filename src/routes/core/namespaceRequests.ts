import { makeRequest, middleware } from "../../utils/helperFunctions";
import { coreClient } from "../../utils/apiClientUtil";
import { Router } from "express";

export const nameSpaceRouter = Router();

nameSpaceRouter.use("/", (req, res, next) => {
    console.log(new Date());
    console.log("Getting namespaces");
    next();
});

nameSpaceRouter.get("/", async (req, res) => {
    try {
        const { body, response } = await makeRequest(
            coreClient.listNamespace("true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
