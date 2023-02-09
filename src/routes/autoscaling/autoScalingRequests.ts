import { autoscalingClient } from "../../utils/apiClientUtil";
import { Router } from "express";
import {
    createDeleteRequest,
    createGetRequest,
    createMiddleware,
    createPostRequest,
    createPutRequest,
    putRequestHeaders,
} from "../../utils/routerUtils";
import {
    V2HorizontalPodAutoscaler,
    V2HorizontalPodAutoscalerBehavior,
    V2HorizontalPodAutoscalerSpec,
    V2MetricSpec,
} from "@kubernetes/client-node";
import { removeEmpty } from "../../utils/helperFunctions";

export const autoscalingRouter = Router();
type AutoscalingBody = {
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    spec: V2HorizontalPodAutoscalerSpec;
};
type UpdateBody = {
    spec: V2HorizontalPodAutoscalerSpec;
};

createMiddleware(autoscalingRouter, "autoscaling");

createPostRequest<V2HorizontalPodAutoscaler, AutoscalingBody>(
    autoscalingRouter,
    (name, namespace, requestBody) => {
        const { annotations, labels, spec: customSpec } = requestBody;
        const defaultSpec = {
            spec: {
                scaleTargetRef: {
                    name,
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                },
            },
        };
        const spec = { ...defaultSpec.spec, ...customSpec };
        const autoscalingRequest: V2HorizontalPodAutoscaler = {
            apiVersion: "autoscaling/v2",
            metadata: { name, annotations, labels },
            spec,
        };
        return autoscalingClient.createNamespacedHorizontalPodAutoscaler(
            namespace,
            removeEmpty(autoscalingRequest),
            "true"
        );
    }
);

createPutRequest<V2HorizontalPodAutoscaler, UpdateBody>(
    autoscalingRouter,
    (name, namespace, originalRequest, requestBody) => {
        originalRequest.spec = {
            ...originalRequest.spec,
            ...requestBody.spec,
        };
        return autoscalingClient.patchNamespacedHorizontalPodAutoscaler(
            name,
            namespace,
            originalRequest,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            putRequestHeaders
        );
    }
);

createDeleteRequest(autoscalingRouter, (name, namespace) => {
    return autoscalingClient.deleteNamespacedHorizontalPodAutoscaler(
        name,
        namespace
    );
});

createGetRequest(autoscalingRouter, (name, namespace) => {
    return autoscalingClient.readNamespacedHorizontalPodAutoscaler(
        name,
        namespace,
        "true"
    );
});
