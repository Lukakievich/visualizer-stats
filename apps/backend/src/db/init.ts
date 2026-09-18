import fs from 'fs'
import path from 'path'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stats_visualizer',
})

const initDb = async () => {
  try {
    const schemaPath = path.join(process.cwd(), 'db/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')

    await pool.query(schema)

    console.log('✅ Database tables created successfully')
    await pool.end()
  } catch (error) {
    console.error('❌ Error initializing database:', (error as Error).message)
    process.exit(1)
  }
}

initDb()
