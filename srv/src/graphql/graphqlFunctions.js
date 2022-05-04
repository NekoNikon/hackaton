const {pubSub} = require("../../config/graphqlPubSubConfig");

const publish = (iterator, client) => {
    let keys = [...new Set(Object.keys(pubSub.subscriptions).map((key) => { return pubSub.subscriptions[key][0] }))];
    //iterator.forEach((iterator)=>{
    keys.forEach(async (value2) => {
        let [query, dbQuery] = value2.split('$query$');
        if (query === iterator) {
            let req = await client.query(dbQuery);
            let reqJson = {};
            reqJson[query] = req.rows;

            await pubSub.publish(value2, reqJson)
        }
    });
}

module.exports = {
    publish
}