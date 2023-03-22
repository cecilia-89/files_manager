import { MongoClient } from "mongodb";
import sha1 from 'sha1'

class DBClient {

    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '27017';
        const db = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}`;

        const client = new MongoClient(url);
        client.connect()
        .then(() => this.connected = true)
        .catch((err) => {
            console.log(err)
        })

        this.db = client.db(db);
        this.connected = false;
    }

    isAlive() {
        return this.connected;
    }

    getCredentials (base64) {
        const decoded = atob(base64)

        const email = decoded.match(/(.+?):/)[1]
        const password = decoded.match(/.+?:(.+)/)[1]

        return [email, sha1(password)]
    }

    paginate(userId, parentId, currentPage, maxSize) {
        return this.db.collection('files').aggregate([
            { $match: {userId, parentId} },
            { $skip: currentPage * maxSize},
            { $limit: maxSize}
        ]).toArray()
    }

    async nbUsers() {
        return await this.db.collection('users').countDocuments();
    }

    async nbFiles() {
        return await this.db.collection('files').countDocuments()
    }

    async getUser(fields) {
        return await this.db.collection('users').findOne(
            fields
            )
    }

    async getFile(fields) {
        return await this.db.collection('files').findOne(
            fields
            )
    }

    async getFiles(fields) {
        return await this.db.collection('files').find(
            fields
        ).toArray()
    }

    async createUser(fields) {
        return await this.db.collection('users').insertOne(fields)
    }

    async uploadFile(fields) {
        await this.db.collection('files').insertOne(fields)
    }
}

const dbClient = new DBClient();
export default dbClient;