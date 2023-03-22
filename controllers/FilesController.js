import dbClient from "../utils/db";
import {v4 as uuid4} from 'uuid'
import redisClient from "../utils/redis";
import { ObjectId } from "mongodb";
const fs = require('fs')
const mime = require('mime-types')

const postUpload = async (body, token) => {

    const path = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (body.parentId && body.parentId !== '0') {
        const file = await dbClient.getFile({_id: new ObjectId(body.parentId)})
        if (!file) {
            return {"error": "Parent not found"}
        }

        if (file.type !== 'folder') {
            return {"error": "Parent is not a folder"}
        }
    } else {
        body.parentId = 0;
    }


    if (!body.isPublic) {
        body.isPublic = false
    }

    const userId = await redisClient.get(`auth_${token}`)
    if (userId) {
        body.userId = userId
    }

    const data = body.data;
    delete body.data;
    if (body.type === 'folder') {
        dbClient.uploadFile(body)
        return body
    }

    const localPath = uuid4()
    if (!fs.existsSync(path)) {
        fs.mkdir(`${path}`, (err) => {
            if (err) throw err
        })
    }

    fs.writeFile(`${path}/${localPath}`, atob(data), (err) => {
        if (err) throw err
    } )

    body.localPath = localPath
    dbClient.uploadFile(body)
    return body;
}


const getShow = async (token, id) => {

    const userId = await redisClient.get(`auth_${token}`)
    const user = await dbClient.getUser({
        _id: new ObjectId(userId)
    })

    if (!user) { return {
        "err": {"error": "Unauthorized"},
        "code": 401
    }}

    const file = await dbClient.getFile({
        _id: new ObjectId(id),
        userId
    })

    if (!file) { return {
        "err": {"error": "Not found"},
        "code": 401
    }}

    return file
}

const getIndex = async (token, params) => {
    const userId = await redisClient.get(`auth_${token}`)
    const user = await dbClient.getUser({ _id: new ObjectId(userId) })
    if (!user) return {"error": "Unauthorized"}

    const file = dbClient.paginate(
                        userId,
                        params.parentId,
                        params.page,
                        20)
    return file

}

const putPublish = async (token, fileId) => {
    const userId = await redisClient.get(`auth_${token}`)
    const user = dbClient.getUser({_id: new ObjectId(userId)})
    if (!user) return {"err": {"error": "Unauthorized"}, "code": 401}

    const file = await dbClient.getFile({
        _id: new ObjectId(fileId),
        userId})

    if (!file) return {"err": {"error": "Not found"}, "code": 404}
    file.isPublic = true
    return file

}

const putUnpublish = async (token, fileId) => {
    const userId = await redisClient.get(`auth_${token}`)
    const user = dbClient.getUser({_id: new ObjectId(userId)})
    if (!user) return {"err": {"error": "Unauthorized"}, "code": 401}

    const file = await dbClient.getFile({
        _id: new ObjectId(fileId),
        userId})

    if (!file) return {"err": {"error": "Not found"}, "code": 404}
    file.isPublic = false
    return file

}

const getFile = async (token, fileId, size) => {
    const userId = await redisClient.get(`auth_${token}`)
    const file = await dbClient.getFile({
        _id: new ObjectId(fileId)
        })

    if (!file) return {"err": {"error": "Not found"}, "code": 404}

    if ((file.isPublic === false && file.userId !== userId) || !file.localPath) {
        return  {"err": {"error": "Not found"}, "code": 404}
    }

    if (file.type === 'folder') {
        return  {
            "err": {"error": "A folder doesn't have content"},
            "code": 400
        }
    }

    const mimetype = mime.lookup(file.name)


    if (file.type === 'image') {
        const path = process.env.FILE_PATH
        const result = fs.readFile(`${path}/${file.localPath}_${size}`, (err, data) => {
            if (err) return {"err": {"error": "Not found"}, "code": 404}

            return data;
        })

        return {"data": result, "mime": mime}
    }


    return {"data": file.data, "mime": mimetype}
}

export {    postUpload,
            getShow,
            getIndex,
            putPublish,
            putUnpublish,
            getFile
        };