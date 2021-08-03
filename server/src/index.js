const { ApolloServer } = require('apollo-server');
const dotenv = require("dotenv")
const typeDefs = require('./schema');

dotenv.config();

const server = new ApolloServer({ typeDefs });