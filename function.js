// Pull in Firebase and GCloud deps
var util = require('util')
var firebase = require("firebase-admin")

var gcloud = require('google-cloud')({
  projectId: process.env.GCP_PROJECT,
})

var serviceAccount = require(__dirname + '/firebase-credentials.json')

// Initialize Firebase App with service account
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://empappathy.firebaseio.com"
})

// Get GCS, Cloud Vision API
var gcs = gcloud.storage()
var vision = gcloud.vision()

// function visiondetect(context, data) {
function visiondetect(event, callback) {
  const data = event.data
  const isDelete = data.resourceState === 'not_exists';
  const isImage = data.contentType.lastIndexOf('image', 0) === 0
  const postKey = data.metadata.postKey

  // if (data !== undefined && !isDelete) {
  if (data !== undefined && !isDelete && isImage && postKey) {
    // Create Firebase Storage public URL
    var urlString = "https://firebasestorage.googleapis.com/v0/b/" +
      data.bucket + "/o/" +
      data.name.replace(/\//, '%2F') + "?alt=media&token=" +
      data.metadata.firebaseStorageDownloadTokens

    // Create GCS File from the data
    var file = gcs.bucket(data.bucket).file(data.name)

    // Use GCS File in the Cloud Vision API
    // vision.detectLabels(file, { verbose: true }, function(err, labels, apiResponse) {
    vision.detect(file, ['face','label'], function(err, detections, apiResponse) {
        if (err) {
          console.log("Vision detection failed: " + err)
        } else {
          var ref = firebase.database().ref("images")
          var types = []

          if( detections.faces !== undefined ){
            for(var i=0; i < detections.faces.length; i++){
              var f = detections.faces[i];
              types.push({
                confidence: f.confidence,
                anger: f.anger,
                blurred: f.blurred,
                headwear: f.headwear,
                joy: f.joy,
                sorrow: f.sorrow,
                surprise: f.surprise,
                underExposed: f.underExposed
              })
            }
          }

          ref.push({
            "url": urlString,
            "name": data.name,
            "postKey": postKey,
            "labels": detections.labels,
            "facesTypes": types
          })

          console.log("Vision detection successfully completed!")
        }
      }
    )
  } else {
    console.log('Not an image or does not exist anymore!')
  }

  callback()
}

module.exports = {
  visiondetect: visiondetect
}
