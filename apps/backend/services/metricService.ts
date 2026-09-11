import pool from '../db/connection.js'

interface Metric {
  id: number
  dashboard_id: number
  name: string
  type: string
  unit: string
  color: string
  created_at: Date
}

export const getMetricsByDashboard = async (
  dashboardId: number,
): Promise<Metric[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM metrics WHERE dashboard_id = $1 ORDER BY created_at DESC',
      [dashboardId],
    )
    return result.rows
  } catch (error) {
    throw new Error(`Failed to fetch metrics: ${(error as Error).message}`)
  }
}

export const getMetricById = async (id: number): Promise<Metric[]> => {
  try {
    const result = await pool.query('SELECT * FROM metrics WHERE id = $1', [id])
    return result.rows[0]
  } catch (error) {
    throw new Error(`Failed to fetch metric: ${(error as Error).message}`)
  }
}

export const createMetric = async (
  dashboardId: number,
  name: string,
  type: string,
  unit: string,
  color: string,
): Promise<Metric[]> => {
  try {
    const result = await pool.query(
      'INSERT INTO metrics (dashboard_id, name, type, unit, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [dashboardId, name, type || 'line', unit, color || '#00ff88'],
    )
    return result.rows[0]
  } catch (error) {
    throw new Error(`Failed to create metric: ${(error as Error).message}`)
  }
}

export const deleteMetric = async (id: string): Promise<Metric[]> => {
  try {
    const result = await pool.query(
      'DELETE FROM metrics WHERE id = $1 RETURNING *',
      [id],
    )
    return result.rows[0]
  } catch (error) {
    throw new Error(`Failed to delete metric: ${(error as Error).message}`)
  }
}
