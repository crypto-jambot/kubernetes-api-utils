import { Router } from "express";
import { secretRouter } from "./core/secretRequests";
import { serviceRouter } from "./core/serviceRequests";
import { ingressRouter } from "./networking/ingressRequests";
import { deploymentRouter } from "./app/deploymentRequests";
import { serviceAccountRouter } from "./core/serviceAccountRequests";
import { podRouter } from "./core/podRequests";
import { nameSpaceRouter } from "./core/namespaceRequests";
import { clusterRoleRouter } from "./rbac/clusterRoleRequests";
import { roleRouter } from "./rbac/roleRequests";
import { roleBindingRouter } from "./rbac/roleBindingRequests";
import { clusterRoleBindingRouter } from "./rbac/clusterRoleBindingRequests";

export const router = Router();

//Routers for categorized requests
router.use("/secret", secretRouter); //For creating/deleting/getting secrets
router.use("/service", serviceRouter); //For creating/deleting/getting services
router.use("/ingress", ingressRouter); //For creating/deleting/getting ingresses
router.use("/deployment", deploymentRouter); //For creating/deleting/getting deployments
router.use("/serviceAccount", serviceAccountRouter); //For creating/deleting/getting service accounts
router.use("/clusterRole", clusterRoleRouter); //For creating/deleting/getting cluster roles
router.use("/role", roleRouter); //For creating/deleting/getting cluster roles
router.use("/roleBinding", roleBindingRouter); //For creating/deleting/getting role bindings
router.use("/clusterRoleBinding", clusterRoleBindingRouter); //For creating/deleting/getting cluster role bindings
router.use("/pod", podRouter); //For getting pods
router.use("/namespace", nameSpaceRouter);
