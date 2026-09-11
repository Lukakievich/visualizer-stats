import pool from '../db/connection.ts';

interface Dashboard {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export const getAllDashboards = async (): Promise<Dashboard[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboards ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to fetch dashboards: ${(error as Error).message}`);
  }
};

export const getDashboardById = async (id: number): Promise<Dashboard | undefined> => {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboards WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to fetch dashboard: ${(error as Error).message}`);
  }
};

export const createDashboard = async (name: string, description?: string): Promise<Dashboard> => {
  try {
    const result = await pool.query(
      'INSERT INTO dashboards (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to create dashboard: ${(error as Error).message}`);
  }
};

export const updateDashboard = async (id: number, name: string, description?: string): Promise<Dashboard> => {
  try {
    const result = await pool.query(
      'UPDATE dashboards SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, id],
    )
    return result.rows[0]
  } catch (error) {
    throw new Error(`Failed to update dashboard: ${(error as Error).message}`)
  }
}

export const deleteDashboard = async (id: number): Promise<Dashboard> => {
  try {
    const result = await pool.query(
      'DELETE FROM dashboards WHERE id = $1 RETURNING *',
      [id],
    )
    return result.rows[0]
  } catch (error) {
    throw new Error(`Failed to delete dashboard: ${(error as Error).message}`)
  }
}
