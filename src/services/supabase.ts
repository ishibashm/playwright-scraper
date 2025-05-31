import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
