import { Router } from "express";
import { secretRouter } from "./core/secretRequests";
import { serviceRouter } from "./core/serviceRequests";
import { ingressRouter } from "./networking/ingressRequests";
import { deploymentRouter } from "./app/deploymentRequests";
import { serviceAccountRouter } from "./core/serviceAccountRequests";
import { nameSpaceRouter } from "./core/namespaceRequests";
import { clusterRoleRouter } from "./rbac/clusterRoleRequests";
import { roleRouter } from "./rbac/roleRequests";
import { roleBindingRouter } from "./rbac/roleBindingRequests";
import { clusterRoleBindingRouter } from "./rbac/clusterRoleBindingRequests";
import { configMapRouter } from "./core/configMapRequests";
import { autoscalingRouter } from "./autoscaling/autoScalingRequests";
import { runAuth } from "../utils/helperFunctions";

export const router = Router();

router.use("/", async (req, res, next) => {
    const authHeader = req.headers.authorization;
    await runAuth(authHeader, next, res);
});

//Routers for categorized requests
router.use("/secret", secretRouter);
router.use("/service", serviceRouter);
router.use("/ingress", ingressRouter);
router.use("/deployment", deploymentRouter);
router.use("/serviceAccount", serviceAccountRouter);
router.use("/clusterRole", clusterRoleRouter);
router.use("/role", roleRouter);
router.use("/roleBinding", roleBindingRouter);
router.use("/clusterRoleBinding", clusterRoleBindingRouter);
router.use("/namespace", nameSpaceRouter);
router.use("/configMap", configMapRouter);
router.use("/autoscaling", autoscalingRouter);
