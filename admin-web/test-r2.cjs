const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Credentials from your previous messages
const R2_ACCESS_KEY_ID = "d716a0ff2234393c5cd47404887f4231"; 
const R2_SECRET_ACCESS_KEY = "3d4ca1ca42a27d684ee8a9b2c7f36bd0b432d989a430cc3e3ce16ba242d759f6";
const R2_ACCOUNT_ID = "515b4b943a810bdcd0ab3add80c37aa9"; 
const BUCKET_NAME = "mpaudio";

async function testUpload() {
  console.log("--- R2 Connection Test ---");
  console.log("Account ID:", R2_ACCOUNT_ID);
  console.log("Bucket:", BUCKET_NAME);

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log("Attempting to upload a test file...");
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "test-from-script.txt",
      Body: "Hello Cloudflare R2! This is a test upload.",
      ContentType: "text/plain",
    });

    const response = await s3Client.send(command);
    console.log("✅ SUCCESS! Upload complete.");
    console.log("Response Metadata:", response.$metadata);
  } catch (error) {
    console.error("❌ FAILED!");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.$metadata) {
      console.error("Status Code:", error.$metadata.httpStatusCode);
    }
  }
}

testUpload();
