import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import {v4 as uuid4} from 'uuid'

const getConnect = async (headers) => {
    const base64 = headers.authorization.slice(6, );
    const [email, password] = dbClient.getCredentials(base64)

    const user = await dbClient.getUser({
        email,
        password: password})

    if (!user) {
        return {'error': 'Unauthorized'}
    }

    const token = uuid4()
    const auth_token = `auth_${token}`

    await redisClient.set(auth_token, user._id.toString(), 86400)
    return {'token': token}
}

const getDisconnect = async (header) => {
    const key = `auth_${header['x-token']}`
    const user = await redisClient.get(key)

    if (!user) {
        return {"error": "Unauthorized"}
    }
    await redisClient.delete(key)
    return ''
}

export { getConnect, getDisconnect };