import express from 'express';
const Queue = require('bull')
import { getStatus, getStats } from '../controllers/AppController';
import { postNew, getMe } from '../controllers/UsersController';
import { getConnect, getDisconnect } from '../controllers/AuthController'
import { postUpload, getShow, getIndex,
         putPublish, putUnpublish, getFile } from '../controllers/FilesController'

const router = express.Router()

router.get('/stats', async (req, res) => {
    res.send( await getStats())
})

router.get('/status', (req, res) => {
    res.send(getStatus())
});

router.post('/users', async(req, res) => {
    if (!req.body.email) {
        return res.status(400).send({"error": "Missing email"})
    }

    if (!req.body.password) {
        return res.status(400).send({"error": "Missing password"})
    }


    const results = await postNew(req.body);
    if (results.error) {
        return res.status(400).send(results)
    }
    return res.status(201).send(results)
});

router.get('/connect', async (req, res) => {
    const results = await getConnect(req.headers)
    if (results.error) {
        return res.status(401).send(results)
    }

    return res.status(200).send(results)
});

router.get('/disconnect', async (req, res) => {
    const result = await getDisconnect(req.headers)
    if (result === '') {
        return res.status(204).send()
    }
    return res.status(401).send(result)
})

router.get('/me', async (req, res) => {
    const response = await getMe(req.headers['x-token'])
    if (response.error) {
        return res.status(401).send(response)
    }
    return res.send(response)
})

router.post('/files' , async (req, res) => {

    if (!req.body.name) {
        return res.status(400).send({"error": "Missing name"})
    }

    if (!req.body.type) {
        return res.status(400).send({"error": "Missing type"})
    }

    if (!req.body.data && req.body.type !== 'folder') {
        return res.status(400).send({"error": "Missing data"})
    }

    const data = await postUpload(req.body, req.headers['x-token'])
    if (data.type === 'image') {
        const fileQueue = new Queue('file transcoding')
        await fileQueue.add({userId: data.userId, fileId: data._id})
    }

    if (data.error) {
        return res.status(400).send(data)
    }
    return res.status(201).send(data)
})

router.get('/files/:id', async (req, res) => {

    const results = await getShow(
        req.headers['x-token'],
        req.params.id)

    if (results.err) {
        return res.status(results.code).send(results.err)
    }

    return res.send(results)

})

router.get('/files', async (req, res) => {
    if (!req.query.page) req.query.page = 0;
    if (!req.parentId) req.query.parentId = 0;

    const result = await getIndex(
        req.headers['x-token'],
        req.query
        )

    res.send(result)
})

router.put('/files/:id/publish', async (req, res) => {
    const token = req.headers['x-token']
    const results = await putPublish(token, req.params.id)

    if (results.err) {
        return res.status(results.code).send(results.err)
    }
    return res.status(200).send(results)
})

router.put('/files/:id/unpublish', async (req, res) => {
    const token = req.headers['x-token']
    const results = await putUnpublish(token, req.params.id)
    if (results.err) {
        return res.status(results.code).send(results.err)
    }
    return res.status(200).send(results)
})

router.get('/files/:id/data', async (req, res) => {
    const token = req.headers['x-token']
    const results = await getFile(token, req.params.id, req.params.size)
    if (results.err) {
        return res.status(results.code).send(results.err)
    }
    return res.setHeader('Content-type', results.mime).send(atob(results.data))
})

export default router;