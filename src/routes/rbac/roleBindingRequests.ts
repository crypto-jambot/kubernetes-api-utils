import { rbacClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import { makeRequest, middleware } from "../../utils/helperFunctions";
export const roleBindingRouter = Router();

type RoleBindingBody = {
    subjects: Subject[];
    roleRef: RoleRef;
};
type Subject = {
    name: string;
    kind: string;
    namespace?: string;
};
type RoleRef = {
    name: string;
    kind: string;
};

roleBindingRouter.use("/:name/:namespace?", (req, res, next) => {
    if (req.method === "GET") {
        next();
        return;
    }
    const { name, namespace = "default" } = req.params;
    middleware(req, "role binding", next, namespace, name);
});

roleBindingRouter.use("/:namespace?", (req, res, next) => {
    if (req.method !== "GET") {
        next();
        return;
    }
    const { namespace = "default" } = req.params;
    middleware(req, "role bindings", next, namespace);
});

roleBindingRouter.post("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    const { subjects: initialSubjects, roleRef: initialRoleRef } =
        req.body as RoleBindingBody;
    // const authorizationNameGroup = "rbac.authorization.k8s.io";
    const authorizationNameGroup = "";
    const subjects = initialSubjects.map((subject) => ({
        ...subject,
        apiGroup: authorizationNameGroup,
    }));
    const roleRef = {
        ...initialRoleRef,
        apiGroup: authorizationNameGroup,
    };
    try {
        const { response, body } = await makeRequest(
            rbacClient.createNamespacedRoleBinding(namespace, {
                apiVersion: "rbac.authorization.k8s.io/v1",
                metadata: {
                    name,
                },
                subjects,
                roleRef,
            })
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

roleBindingRouter.delete("/:name/:namespace?", async (req, res) => {
    const { name, namespace = "default" } = req.params;
    try {
        const { response, body } = await makeRequest(
            rbacClient.deleteNamespacedRoleBinding(name, namespace, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

roleBindingRouter.get("/:namespace?", async (req, res) => {
    const { namespace = "default" } = req.params;
    try {
        const { response, body } =
            namespace === "all"
                ? await makeRequest(rbacClient.listRoleForAllNamespaces())
                : await makeRequest(
                      rbacClient.listNamespacedRoleBinding(namespace, "true")
                  );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
