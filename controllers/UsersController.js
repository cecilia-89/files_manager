import dbClient from '../utils/db';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

const postNew = async (user) => {

    const hashed_password = sha1(user.password)

    const value = await dbClient.getUser({
        email: user.email
    })

    if (value) {
        return {'error': 'Already exist'}
    }

    const newUser = await dbClient.createUser({
        email: user.email,
        password: hashed_password
    })

    return {
        email: user.email,
        id: newUser.insertedId.toString()}
}

const getMe = async (token) => {
    const key = `auth_${token}`
    const userId = await redisClient.get(key)

    if (!userId) {
        return {"error": "Unauthorized"}
    }

    const currentUser = await dbClient.getUser({
         _id: new ObjectId(userId)
        })

    return {
        id: userId,
        email: currentUser.email
    }
}

export { postNew, getMe };