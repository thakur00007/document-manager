import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";

class StorageService {
  constructor() {
    this.provider = process.env.UPLOAD_ENV || "minio"; // 'aws' or 'minio'
    this.bucket = process.env.AWS_BUCKET_NAME;

    const config = {
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };

    if (this.provider === "minio") {
      console.log("Storage Service: Using MinIO");
      config.endpoint = process.env.MINIO_ENDPOINT; // e.g., 'http://localhost:9000'
      config.forcePathStyle = true; // REQUIRED for MinIO
    } else {
      console.log("Storage Service: Using AWS S3");
    }

    this.client = new S3Client(config);
  }

  async upload(filePath, key, mimeType) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fs.createReadStream(filePath),

      ContentType: mimeType,
    });

    await this.client.send(command);
    fs.unlinkSync(filePath);
  }

  async delete(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return this.client.send(command);
  }

  async getSignedUrl(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    // Link expires in 5 minutes (300 seconds)
    return getSignedUrl(this.client, command, { expiresIn: 300 });
  }

  async getFileStream(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    return response.Body;
  }
}

const storageService = new StorageService();
export default storageService;
