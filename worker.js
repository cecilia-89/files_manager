const Queue = require('bull');
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';


const fileQueue = new Queue('file transcoding')
fileQueue.process( async (job, done) => {
    const path = process.env.FOLDER_PATH || '/tmp/files_manager';

    const userId = job.data.userId
    const fileId = job.data.fileId
    if (!userId)  done(new Error('Missing userId'))
    if (!fileId)  done(new Error('Missing fileId'))

    const file = await dbClient.getFile({
        userId: userId,
        _id: new ObjectId(fileId)
    })

    if (!file) done(new Error('File not found'))
    const fileObject = JSON.parse(JSON.stringify(file))

    const sizes = [250, 500, 100]

    sizes.forEach((async (size) => {
        const thumbnail = await imageThumbnail(
            `${path}/${fileObject.localPath}`, {width: size}
            )

        console.log(`thumbnail: ${thumbnail}`)

        fs.writeFile(`${path}/${fileObject.localPath}_${size}`, thumbnail)
    }))

})