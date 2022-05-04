const {PubSub} = require("graphql-subscriptions");

const graphqlPubSubConfig = {
    pubSub: new PubSub()
};

module.exports = graphqlPubSubConfig;