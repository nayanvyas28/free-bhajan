import { S3Client } from "@aws-sdk/client-s3";
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
 */
export const uploadToR2 = async (file) => {
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

        // We can't easily return progress to the UI from here without a callback, 
        // but for now we'll just log it.
        parallelUploads3.on("httpUploadProgress", (progress) => {
            console.log(`[R2] Progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
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
