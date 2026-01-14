-- Seed inventory data for initial products
-- Each product starts with 100 units in stock
INSERT INTO
    inventory (product_id, stock)
VALUES
    (1, 100), -- Pro Sound Max
    (2, 100), -- UltraBook Air
    (3, 100), -- FitTrack Pro
    (4, 100), -- Phone X12
    (5, 100), -- MechKey RGB
    (6, 100) -- Lumina Bulb
    ON CONFLICT (product_id) DO
UPDATE
SET
    stock = EXCLUDED.stock;