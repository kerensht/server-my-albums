const AWS = require('aws-sdk');
const req = require('express/lib/request');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const bucket = process.env.S3_BUCKET;

const fileStorage = multerS3({
    //acl: 'public-read',
    acl: 'private',
    s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: "inline",
    bucket: process.env.S3_BUCKET,
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname })
    },
    key: (req, file, cb) => {
        const fileName = "images/" + new Date().getTime() + "-" + file.originalname;
        cb(null, fileName);
    }
});

const uploadImageToS3 = multer({ storage: fileStorage }).single('image');

const getImageFromS3 = async (req, res, next) => {
    const Key = req.query.key;
    try {
        const { Body } = await s3.getObject({
            Key,
            Bucket: bucket
        }).promise();
        req.imageBuffer = Body;
        next();
    } catch (err) {
        console.log(err);
    }
}

const deleteImageFromS3 = async (req, res, next) => {
    const Key = req.body.key
    console.log(Key, bucket)
    try {
        await s3.deleteObject({
            Key,
            Bucket: bucket
        }).promise();
        next();
    } catch (err) {
        console.log(err)
        res.status(404).send({
            message: "File not found"
        });
    }
}

module.exports = {
    uploadImageToS3,
    deleteImageFromS3,
    getImageFromS3
};