import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import logger from './logger';

// サービスアカウントキーのパス (プロジェクトルートからの相対パス)
const KEY_FILE_PATH = 'google-drive-credentials.json';
// Google Drive APIのスコープ
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * 指定されたファイルをGoogle Driveの指定されたフォルダにアップロードします。
 * @param filePath アップロードするファイルのローカルパス
 * @param folderId アップロード先のGoogle DriveフォルダID
 * @returns アップロードされたファイルのID (成功時)
 * @throws エラーが発生した場合
 */
export async function uploadFileToDrive(filePath: string, folderId: string): Promise<string | null | undefined> {
  try {
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    // GoogleAuthインスタンスを直接使用
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: SCOPES,
    });
    const drive = google.drive({ version: 'v3', auth: auth }); // authClientの代わりにauthインスタンスを渡す

    const fileName = path.basename(filePath);
    const fileMetadata = {
      name: fileName,
      parents: [folderId], // アップロード先のフォルダIDを指定
    };
    const media = {
      mimeType: 'text/csv',
      body: fs.createReadStream(filePath),
    };

    logger.info(`Uploading ${fileName} to Google Drive folder ${folderId}...`);
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id', // レスポンスで取得するフィールド (ファイルID)
    });

    logger.info(`File uploaded successfully. File ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    logger.error(`Failed to upload file to Google Drive: ${error}`);
    if (error instanceof Error) {
        logger.error(`Error details: ${error.message}`);
        if ((error as any).response?.data?.error?.message) {
            logger.error(`Google API Error: ${(error as any).response.data.error.message}`);
        }
    }
    throw error;
  }
}
