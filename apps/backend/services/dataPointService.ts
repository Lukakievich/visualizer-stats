import pool from '../db/connection.js'

interface DataPoint {
  id: number
  metric_id: number
  value: number
  timestamp: Date
}

interface AddDataPoint {
  metric_id: number
  value: number
}

export const getDataPointsByMetric = async (
  metricId: number,
  limit = 100,
): Promise<DataPoint[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_points WHERE metric_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [metricId, limit],
    )
    return result.rows.reverse() // Вернуть в хронологическом порядке
  } catch (error) {
    throw new Error(`Failed to fetch data points: ${(error as Error).message}`)
  }
}

export const addDataPoint = async (
  metricId: number,
  value: number,
): Promise<DataPoint[]> => {
  try {
    const result = await pool.query(
      'INSERT INTO data_points (metric_id, value) VALUES ($1, $2) RETURNING *',
      [metricId, value],
    )
    return result.rows[0]
  } catch (error) {
    throw new Error(`Failed to add data point: ${(error as Error).message}`)
  }
}

export const addDataPoints = async (
  dataPoints: AddDataPoint[],
): Promise<DataPoint[]> => {
  try {
    const values = dataPoints
      .map((dp) => `(${dp.metric_id}, ${dp.value})`)
      .join(',')
    const result = await pool.query(
      `INSERT INTO data_points (metric_id, value) VALUES ${values} RETURNING *`,
    )
    return result.rows
  } catch (error) {
    throw new Error(`Failed to add data points: ${(error as Error).message}`)
  }
}

export const deleteOldDataPoints = async (
  metricsOlderThanHours = 24,
): Promise<number> => {
  // Удаляет данные старше N часов (для оптимизации)
  try {
    const result = await pool.query(
      `DELETE FROM data_points WHERE timestamp < NOW() - INTERVAL '${metricsOlderThanHours} hours'`,
    )
    return result.rowCount || 0
  } catch (error) {
    throw new Error(
      `Failed to delete old data points: ${(error as Error).message}`,
    )
  }
}
