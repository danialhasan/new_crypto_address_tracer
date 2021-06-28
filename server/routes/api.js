/**
 * This is the route file that deals with image and post processing. 
 * It uses the Amazon Rekognition API on the US-east-2 server. 
 */

// express setup
const express = require('express');
const router = express.Router();

// AWS setup
// const {
//   RekognitionClient,
//   DetectLabelsCommand,
// } = require("@aws-sdk/client-rekognition");
// const {
//   s3Client
// } = require('../modules/s3Client.js')
// const {
//   CreateBucketCommand
// } = require("@aws-sdk/client-s3")

// data:image/jpg;base64, prefix must be removed, because the stuff after is the actual base64. 
let image =
  `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`

// CORS setup
router.use((req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin', 'https://unsplash-clone-dh.netlify.app');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With")
  next()
})


router.get('/', (req, res) => {
  res.send("This is the server API root handler!")
  console.log(req)
});

let variable;
async function processImage(base64String) {
  // let imageBytes = new ArrayBuffer(base64String.length)
  // let ua = new Uint8Array(imageBytes);
  // for (var i = 0; i < base64String.length; i++) {
  //   ua[i] = base64String.charCodeAt(i);
  // }
  // const client = new RekognitionClient({
  //   region: process.env.AWS_REGION
  // });

  // const params = {
  //   "Image": {
  //     "Bytes": ua
  //   },
  //   "MaxLabels": 3,
  //   "MaxConfidence": 60
  // };
  // const command = new DetectLabelsCommand(params)

  // let awsResponse = await client.send(command)
  //   .then((response) => {
  //     res.send(response)
  //     console.log(response)
  //   })
  //   .catch((error) => {
  //     throw error
  //   })
  // console.log(awsResponse) 

}

async function interactWithS3() {
  const {
    CreateBucketCommand,
    DeleteBucketCommand,
    ListObjectsCommand,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand
  } = require("@aws-sdk/client-s3")
  const {
    s3Client
  } = require("../modules/s3Client.js")

  // converting base64 image string to buffer
  let buffer = new Buffer.from(image, 'base64') //buffer from image
  let base64data = buffer.toString('ascii')

  const bucketParams = {
    Bucket: "danialhasanbucket",
    // Specify the name of the new object. For example, 'index.html'.
    // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
    // Key: "base64buffer.jpg",
    // // Content of the new object.
    // Body: buffer,
    // ContentEncoding: 'base64'
  };

  try {
    const data = await s3Client.send(new ListObjectsCommand(bucketParams));
    console.log("Success", data);
    res.send(data)
  } catch (err) {
    console.log("Error", err);
    res.send(err)
  }
}

async function interactWithRekognition() {
  const {
    DetectLabelsCommand,
    RekognitionClient,
    Rekognition
  } = require('@aws-sdk/client-rekognition');
  var client = new RekognitionClient();
  const params = {
    "Image": {
      "S3Object": {
        "Bucket": "danialhasanbucket",
        "Name": "cat.jpeg"
      }
    },
    "MaxLabels": 3,
    "MinConfidence": 75
  };
  return new Promise(async (resolve, reject) => {
    try {
      const data = await client.send(new DetectLabelsCommand(params))
      console.log('Success', data)
      // console.log('Success', command)
      // console.log('Success', new Rekognition)
      // console.log("success", rekognition)
      resolve(data)
    } catch (error) {
      console.log(error)
      reject(error);
    }
  })
}
router.route('/image')
  .get(async (req, res) => {
    interactWithRekognition()
    // console.log(response)
    res.send("Request received!")

  })
// .post((req, res) => {
//   res.send("Image post request received")
// })

module.exports = router;