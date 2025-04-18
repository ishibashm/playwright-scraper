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
