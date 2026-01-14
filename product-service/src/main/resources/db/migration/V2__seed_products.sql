-- Seed data for products table
-- Run this after V1__create_products_table.sql
INSERT INTO
    products (
        id,
        name,
        description,
        price,
        currency,
        image_url,
        category,
        is_active
    )
VALUES
    (
        1,
        'Pro Sound Max',
        'Noise cancelling over-ear headphones with 40h battery.',
        299.00,
        'USD',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAgQCKJjjlw5ZWElITSaWtRYhasZYZg6viYyjT8iwnq24L07L5BpAzd5JtEv6dNEivi8bmcGygNHjdsmsHeAb_NXRT7UL6PPJr4Nbe7LOHrrdwE7HMgJxIaohLcf_41HyFZJWclzSQD7rj16YhNV0fKckJP3jSWpLbdnh5pkXFaFWoxTGsXLZDeZ8gaJdM03jZt2NrsKyZMufNQ8IiczpYugn1aGZghM4WBCSjT10PWv_Z8dXJof4ooAQ3MrY99lJApbNJFnD6UfA',
        'Audio',
        true
    ),
    (
        2,
        'UltraBook Air',
        'Lightweight, powerful, and ready for anything.',
        1299.00,
        'USD',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuARhCP6DJJysPRP8AQ7bWmyoU60e_Dqysg3uG6deafPmGlCQYS4PmR6RtLCLahPYF_8m9pM9g-hF0AzDJsCNc6e10sVy9Rph702XgixFM_-QuhTLvSVMFYmb__rTAhyckNT5c4ymlxfc2y3Ytf1g2nf8aeVDe3A2wW6V4SPDsm9Ehre5qrW1B8IEURbuBLZa7Ezxt_Xbv_IX-AsQHZzWqZ0axeoWp5xqljGbE-uV4_9R5DYzgKZmAr_yEilhsIM3Pp_yjbVMjiH5Q',
        'Laptop',
        true
    ),
    (
        3,
        'FitTrack Pro',
        'Your personal health companion on your wrist.',
        199.00,
        'USD',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB3MnJttsmfz78DbHwnXhFjDHzGahzzcmwR4QLenK35qaRn0eZYNzcQa1O_rNILKS9jzExWaRR-1BVSkhW-2MQq6nlXiAK5SmT64AEvn0O2PE_oFWq9ZQNBjfp1hFBYcqp2bSy0t2iVrLItlO4MfkFM8avpCfE_DpQrzN3Z7rCmK39XFJQhstF9iEV8gbGk5s_XRlM0bvCvgoyOySLx6GFKTuc1T6AchV_Agz0x8BvOdyuPLVTBXyVmm5aRtBQ00-_J0B20nM0tww',
        'Wearable',
        true
    ),
    (
        4,
        'Phone X12',
        'The future of mobile computing in your pocket.',
        899.00,
        'USD',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAfG4Bsw41OlCBqcqIuu04QpN49nyK-yQkiEIGjwc_M-jQKtPy9AA8TOiKItC6eZitpr58NNLvOjrM3ME0Zucwr0I6NGdWmTmWHXMCPHMXM-bRwPNNYakU8b4bv3SjuDnMSObK0O32Tobn1iB-kVSxKavI8nJuE91Zd9v5UN-zQ9jk3w_HbSJIPh-hNN1iPa33GJUA5-E89Xa8juklFkR3BK_EB4cE72GuRgUy2gBE4J0P0YcgqvWVqJo5lTJylxEm2tcjrZjnAKg',
        'Phone',
        true
    ),
    (
        5,
        'MechKey RGB',
        'Tactile switches for the ultimate typing experience.',
        149.00,
        'USD',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA2pcutzXaF3sNLnXEhdjSajgvhrMjLW_Pg3ykWSzfwDWMLSG3l21VTz6y-rjzneNjRq4VSw71t6-jNnXWTfDUToNbQXugNEzuIOJiveTnRS0pGlV5Ru3PTFOvQNI7ccQ46c31ByM-UE_Ca9YZqqNPzPU9BJLMTT_m55-mV-xna3E7Z1RwshO2QUn3H2G4U3JXye9QLIB8e9nvso3vLi-KtWVnEICUuuwpDndJa9okAG8NrCUgCL8pheW0BMql7PtU2lWMV6H1xMw',
        'Keyboard',
        true
    ),
    (
        6,
        'Lumina Bulb',
        'Smart lighting you can control from anywhere.',
        35.00,
        'USD',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCDEBIZeUeE3k-HnxbBJm0jaAAPn_GTe0xrvWXXOrdXV3juR0X8mxfEUU5CTnyBX0sdtGdr45BmIIHGhu_xljVbeWHwzAGM1enUN6gffnIPNuL4vfvUFqWv2CL7hfJRoexfPsgr0vwXA8PMM8y6ezPBjmjSOwM8ndUygvN8luld5-oyPFapBy_k7oPa4LIBsDOVwQu9uHAM4b8VXmpTkASF5YqEflsNmE0Fsz_XfKwhCaCsJOCmh58d_O5xvKX-wklKcJsLA9KU5A',
        'Smart Home',
        true
    ) ON CONFLICT (id) DO
UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active;

-- Reset sequence to continue after inserted IDs
SELECT
    setval (
        'products_id_seq',
        (
            SELECT
                MAX(id)
            FROM
                products
        )
    );