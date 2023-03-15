require("dotenv").config();
import express from "express";
import http from "http";
import { ApolloServer } from "apollo-server-express";
// import { startStandaloneServer } from "@apollo/server/standalone";
import schema from "./schema";
import { getUser } from "./users/users.utils";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
// import { SubscriptionServer } from "subscriptions-transport-ws";
// import { execute, subscribe } from "graphql";
// import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import WebSocket, { WebSocketServer as WSWebSocketServer } from "ws";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { useServer } from "graphql-ws/lib/use/ws";

const PORT = process.env.PORT;

async function startServer() {
  const app = express();
  app.use(graphqlUploadExpress());

  app.use("/static", express.static("uploads"));
  const httpServer = http.createServer(app);

  const WebSocketServer = WebSocket.Server || WSWebSocketServer;
  const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: "/graphql",
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    playground: true,
    introspection: true,
    context: async (ctx) => {
      return {
        loggedInUser: await getUser(ctx.req.headers.token),
      };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start(); // add this line
  server.applyMiddleware({ app });

  httpServer.listen(PORT, () => {
    console.log(`🚀Server is running on http://localhost:${PORT}/graphql ✅`);
  });
}

startServer();

// const subscriptionServer = SubscriptionServer.create(
//   {
//     schema,
//     execute,
//     subscribe,
//     async onConnect({ token }, webSocket, context) {
//       if (token === undefined) {
//         throw new Error("You can't listen.");
//       }
//       console.log("subscribing?");
//       const loggedInUser = await getUser(token);
//       console.log("subscribing happend");
//       return { loggedInUser };
//     },
//     onDisconnect(webScoket, context) {},
//   },
//   { server: httpServer, path: "/graphql" }
// );
