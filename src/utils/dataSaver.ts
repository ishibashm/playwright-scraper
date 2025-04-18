import fs from 'fs';
import path from 'path';
import { config } from '../config/config';
import { formatDate } from './dateFormatter';
import logger from './logger';

export function saveDataAsJson(data: any) {
  try {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    const timestamp = formatDate(new Date());
    const filePath = path.join(config.dataDir, `scraped-${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Data saved to ${filePath}`);
    return filePath;
  } catch (e) {
    logger.error(`Failed to save data: ${e}`);
    throw e;
  }
}

export function saveDataAsCsv(data: any[]) {
  try {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    const timestamp = formatDate(new Date());
    const filePath = path.join(config.dataDir, `scraped-${timestamp}.csv`);
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
