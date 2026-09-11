-- Дашборды
CREATE TABLE dashboards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Метрики
CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  dashboard_id INT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'line',
  unit VARCHAR(50),
  color VARCHAR(7) DEFAULT '#00ff88',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dashboard_id, name)
);

-- Точки данных
CREATE TABLE data_points (
  id SERIAL PRIMARY KEY,
  metric_id INT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  value FLOAT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX idx_data_points_metric_time 
  ON data_points(metric_id, timestamp DESC);

CREATE INDEX idx_metrics_dashboard 
  ON metrics(dashboard_id);