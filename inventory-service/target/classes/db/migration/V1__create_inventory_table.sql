-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    product_id BIGINT PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW ()
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory (stock);