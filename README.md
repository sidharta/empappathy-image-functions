# Empappathy Image Functions

Google Function that analyse images from Google Cloud Storage and save the result into Firebase database.

## Deploy:

gcloud alpha functions deploy visiondetect \
  --stage-bucket [FUNCTIONS_BUCKET] \
  --trigger-bucket [FIREBASE_BUCKET]
