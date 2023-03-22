import { createClient } from 'redis';

class RedisClient {

    constructor() {
        this.client = createClient();
        this.client.on('error', error => {
            console.log(error)
        })
        this.client.connect()
    }

    isAlive() {
        return this.client.isOpen
    }

    async get(key) {
        return await this.client.get(key)
    }

    async set(key, value, duration) {
        await this.client.set(key, value, {
            EX: duration,
            NX: true,
        });
    }

    async delete(key) {
        await this.client.del(key);
    }
};

const redisClient = new RedisClient();
export default redisClient;