const { createServer } = require("http");
const { makeExecutableSchema } = require("apollo-server");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./schema");
const { createStore } = require("./utils");
const resolvers = require("./resolvers");
const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");
const isEmail = require("isemail");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const express = require("express");
const pubSub = require("./pubSub")

const store = createStore();

async function startApolloServer() {
  const app = express();
  const httpServer = createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  // APOLLOSERVER
  const server = new ApolloServer({
    schema,
    dataSources: () => ({
      launchAPI: new LaunchAPI(),
      userAPI: new UserAPI({ store }),
      pubSub,
    }),
    context: async ({ req }) => {
      const auth = (req.headers && req.headers.authorization) || "";
      const email = Buffer.from(auth, "base64").toString("ascii");
      if (!isEmail.validate(email)) return { user: null };
      const users = await store.users.findOrCreate({ where: { email } });
      const user = (users && users[0]) || null;
      return { user: { ...user.dataValues } };
    },
  });

  //
  const subscriptionServer = SubscriptionServer.create(
    {
      // This is the `schema` we just created.
      schema,
      // These are imported from `graphql`.
      execute,
      subscribe,
      onConnect: async (connectionParams) => {
        const auth = connectionParams.authorization || "";
        const email = Buffer.from(auth, "base64").toString("ascii");
        if (!isEmail.validate(email)) return { user: null };
        const users = await store.users.findOrCreate({ where: { email } });
        const user = (users && users[0]) || null;
        if (!user) {
          throw new Error("Missing auth token!");
        }
      },
    },
    {
      // This is the `httpServer` we created in a previous step.
      server: httpServer,
      // This `server` is the instance returned from `new ApolloServer`.
      path: "/subscriptions",
    }
  );

  await server.start();
  server.applyMiddleware({ app });
  httpServer.listen(4000);
  return { app, server, httpServer };
}

startApolloServer();
