const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const keys = require("../config/keys");

const client = redis.createClient(keys.redisUrl);

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options) {
  this._cache = true;
  this._hashKey = JSON.stringify(options.key || "blah");
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this._cache) return exec.apply(this, arguments);

  console.log("IM ABOUT TO RUN SOME QUERY");
  console.log(this.getQuery());
  const key = Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name,
  });
  const cacheValue = await client.hget(this._hashKey);
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }
  const result = await exec.apply(this, arguments);

  client.hset(this._hashKey, JSON.stringify(result), "EX", 10);
  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
