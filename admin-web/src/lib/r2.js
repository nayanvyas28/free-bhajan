import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// R2 Configuration from environment variables
const r2Config = {
    endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    },
};

const s3Client = new S3Client(r2Config);

/**
 * Uploads a file to Cloudflare R2 with correct Content-Type for streaming
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 */
export const uploadToR2 = async (file, onProgress) => {
    try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        let bucketName = import.meta.env.VITE_R2_BUCKET_NAME_AUDIO || "mpaudio";
        let publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL_AUDIO;
        
        const isVideo = ['mp4', 'm4v', 'mov', 'mkv'].includes(fileExt);
        const isAudio = ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(fileExt);

        if (isVideo) {
            contentType = 'video/mp4';
            bucketName = import.meta.env.VITE_R2_BUCKET_NAME_VIDEO || "mpbucket";
            publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL_VIDEO;
        } else if (isAudio) {
            contentType = 'audio/mpeg';
            bucketName = import.meta.env.VITE_R2_BUCKET_NAME_AUDIO || "mpaudio";
            publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL_AUDIO;
        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
            contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        }

        console.log(`[R2] Starting upload for ${file.name} to ${bucketName} as ${contentType}`);

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: file,
                ContentType: contentType,
            },
            queueSize: 4,
            partSize: 1024 * 1024 * 5, // 5MB parts
            leavePartsOnError: false,
        });

        // Pass progress to UI if callback provided
        parallelUploads3.on("httpUploadProgress", (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`[R2] Progress: ${percent}%`);
            if (onProgress) onProgress(percent);
        });

        await parallelUploads3.done();
        
        const publicUrl = `${publicBaseUrl}/${fileName}`;
        console.log(`[R2] Upload Success! URL: ${publicUrl}`);
        
        return publicUrl;
    } catch (error) {
        console.error("R2 Upload Error Details:", error);
        if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
            throw new Error("Cloudflare Connection Blocked (CORS). Please ensure you have enabled CORS in R2 Settings.");
        }
        throw error;
    }
};

/**
 * Deletes a file from Cloudflare R2
 * @param {string} publicUrl - The full public URL of the file to delete
 */
export const deleteFromR2 = async (publicUrl) => {
    if (!publicUrl) return;
    
    try {
        // 1. Determine bucket and file key from URL
        let bucketName = "";
        let fileKey = "";

        const audioBase = import.meta.env.VITE_R2_PUBLIC_URL_AUDIO;
        const videoBase = import.meta.env.VITE_R2_PUBLIC_URL_VIDEO;

        if (publicUrl.startsWith(audioBase)) {
            bucketName = import.meta.env.VITE_R2_BUCKET_NAME_AUDIO || "mpaudio";
            fileKey = publicUrl.replace(`${audioBase}/`, "");
        } else if (publicUrl.startsWith(videoBase)) {
            bucketName = import.meta.env.VITE_R2_BUCKET_NAME_VIDEO || "mpbucket";
            fileKey = publicUrl.replace(`${videoBase}/`, "");
        } else {
            console.warn("[R2] URL does not match known R2 public bases. Skipping deletion:", publicUrl);
            return;
        }

        console.log(`[R2] Attempting to delete: ${fileKey} from bucket: ${bucketName}`);

        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        });

        await s3Client.send(deleteCommand);
        console.log(`[R2] Deleted successfully: ${fileKey}`);
    } catch (error) {
        console.error("[R2] Deletion Error:", error);
        // We don't throw here to avoid blocking the DB deletion if R2 fails
        // but we log it for awareness.
    }
};
