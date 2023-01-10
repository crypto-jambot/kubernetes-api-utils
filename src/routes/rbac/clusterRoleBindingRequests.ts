import { rbacClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import { makeRequest } from "../../utils/helperFunctions";

export const clusterRoleBindingRouter = Router();
type RoleBindingBody = {
    annotations: Record<string, string>;
    labels: Record<string, string>;
    roleRef: RoleRef;
    subjects: Subject[];
};
type RoleRef = {
    name: string;
    kind: string;
};
type Subject = {
    name: string;
    namespace?: string;
    kind: string;
};

clusterRoleBindingRouter.post("/:name", async (req, res) => {
    const { name } = req.params;
    const {
        annotations,
        labels,
        roleRef: initialRoleRef,
        subjects: initialSubjects,
    } = req.body as RoleBindingBody;
    const roleRef = { ...initialRoleRef, apiGroup: "" };
    const subjects = initialSubjects.map((subject) => ({
        ...subject,
        apiGroup: "",
    }));
    try {
        const { response, body } = await makeRequest(
            rbacClient.createClusterRoleBinding({
                apiVersion: "rbac.authorization.k8s.io/v1",
                metadata: { name, annotations, labels },
                roleRef,
                subjects,
            })
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

clusterRoleBindingRouter.delete("/:name", async (req, res) => {
    const { name } = req.params;
    try {
        const { response, body } = await makeRequest(
            rbacClient.deleteClusterRoleBinding(name, "true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});

clusterRoleBindingRouter.get("/", async (req, res) => {
    try {
        const { response, body } = await makeRequest(
            rbacClient.listClusterRoleBinding("true")
        );
        res.status(response.statusCode as number).json(body);
    } catch (err: any) {
        res.status(err.statusCode).json(err.message);
    }
});
