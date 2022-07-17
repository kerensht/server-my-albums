const express = require('express');
const { Readable } = require('stream')
const { uploadImageToS3, deleteImageFromS3, getImageFromS3 } = require('../middleWare/s3-handlers');
const Image = require('../models/imageModel')

const router = new express.Router();

router.post('/upload-image', uploadImageToS3, async (req, res) => {
    console.log(req.file);
    if (!req.file) {
        res.status(422).send({
            code: 422,
            message: 'File not uploaded'
        });
    }

    const image = new Image({
        originalName: req.file.originalname,
        storageName: req.file.key.split("/")[1],
        bucket: process.env.S3_BUCKET,
        region: process.env.AWS_REGION,
        key: req.file.key
    });

    try {
        await image.save();
        res.send(image);
    } catch (err) {
        console.log(err);
    }

    res.send();
});

router.get('/get-images', async (req, res) => {
    try {
        const images = await Image.find({});
        if (!images) {
            res.send([]);
        }
        res.send(images);
    } catch (err) {
        console.log(err);
    }
})

router.get('/get-image', getImageFromS3, async (req, res) => {
    const imageName = req.query.name;
    const stream = Readable.from(req.imageBuffer);
    res.setHeader(
        'Content-Disposition',
        'inline; filename=' + imageName
    );
    stream.pipe(res);
});

router.delete('/delete-image', deleteImageFromS3, async (req, res) => {
    try {
        await Image.findByIdAndDelete(req.body.id);
        res.send({ status: 200 });
    } catch (err) {
        console.log(err)
    }
});

module.exports = router;