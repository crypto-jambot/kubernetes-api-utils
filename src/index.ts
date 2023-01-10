import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { router } from "./routes/router";
const app = express();
const port = process.env.PORT || 3000;

// const schema = buildSchema(`
//   type Query {
//     hello: String
//     namespace: Namespace
//     pod: Pod
//   },
//
//   type Namespace {
//     test: String,
//     test2: Int
//   },
//
//   type Pod {
//     apiVersion: String,
//     kind: String,
//     metadata: Metadata
//   },
//
//   type Metadata {
//     resourceVersion: String
//   }
// `);
// const rootValue = {
//     namespace: () => ({ test: "This is a string", test2: 69 }),
//     pod: async () =>
//         (await axios({ method: "GET", url: "http://localhost:3000/getPods" }))
//             .data,
// };

app.use(bodyParser.json({ limit: Infinity }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use("/", router);

// app.use("/graphql", graphqlHTTP  ({ schema, rootValue, graphiql: true }));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
