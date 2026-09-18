import pool from '../db/connection.js'

interface DataPoint {
  id: number
  metric_id: number
  value: number
  timestamp: Date
}

interface AddDataPointInput {
  metric_id: number
  value: number
}

export const getDataPointsByMetric = async (
  metric_id: number,
  limit: number = 100,
): Promise<DataPoint[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM data_points WHERE metric_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [metric_id, limit],
    )
    return result.rows.reverse()
  } catch (error) {
    throw new Error(`Failed to fetch data points: ${(error as Error).message}`)
  }
}

// Основная функция - добавляет несколько точек
export const addDataPoints = async (
  dataPoints: AddDataPointInput[],
): Promise<DataPoint[]> => {
  try {
    if (dataPoints.length === 0) {
      return []
    }

    // Конвертируем массив в SQL VALUES
    const values = dataPoints
      .map((_, index) => {
        const paramIndex1 = index * 2 + 1 // $1, $3, $5...
        const paramIndex2 = index * 2 + 2 // $2, $4, $6...
        return `($${paramIndex1}, $${paramIndex2})`
      })
      .join(',')

    // Раскладываем все значения в плоский массив
    const params = dataPoints.flatMap((dp) => [dp.metric_id, dp.value])

    const result = await pool.query(
      `INSERT INTO data_points (metric_id, value) VALUES ${values} RETURNING *`,
      params,
    )
    return result.rows
  } catch (error) {
    throw new Error(`Failed to add data points: ${(error as Error).message}`)
  }
}

export const deleteOldDataPoints = async (
  metricsOlderThanHours: number = 24,
): Promise<number> => {
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
