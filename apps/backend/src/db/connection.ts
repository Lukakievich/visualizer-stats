import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

interface PoolConfig {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
}

const config: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stats_visualizer',
};

const pool = new Pool(config);

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
});

export default pool;