import fs from 'fs';
import path from 'path';
// config のインポートパスを修正 (相対パスを一段上に)
import { config } from '../config';
import { formatDate } from './dateFormatter';
import logger from './logger';

// suffix 引数を追加 (デフォルトは空文字)
export function saveDataAsJson(data: any, suffix: string = '') {
  try {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    const timestamp = formatDate(new Date());
    // ファイル名に suffix を含める
    const filePath = path.join(config.dataDir, `scraped-${timestamp}${suffix}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Data saved to ${filePath}`);
    return filePath;
  } catch (e) {
    logger.error(`Failed to save data: ${e}`);
    throw e;
  }
}

// suffix 引数を追加 (デフォルトは空文字)
export function saveDataAsCsv(data: any[], suffix: string = '') {
  try {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    const timestamp = formatDate(new Date());
    // ファイル名に suffix を含める
    const filePath = path.join(config.dataDir, `scraped-${timestamp}${suffix}.csv`);
    if (!Array.isArray(data) || data.length === 0) {
      fs.writeFileSync(filePath, '', 'utf-8');
      logger.info(`CSV file created (empty): ${filePath}`);
      return filePath;
    }
    // ヘッダー行
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    // データ行
    for (const row of data) {
      const values = headers.map(h => {
        const v = row[h] ?? '';
        // ダブルクォートで囲み、内部の"は""にエスケープ
        return '"' + String(v).replace(/"/g, '""') + '"';
      });
      csvRows.push(values.join(','));
    }
    fs.writeFileSync(filePath, csvRows.join('\n'), 'utf-8');
    logger.info(`CSV data saved to ${filePath}`);
    return filePath;
  } catch (e) {
    logger.error(`Failed to save CSV data: ${e}`);
    throw e;
  }
}
