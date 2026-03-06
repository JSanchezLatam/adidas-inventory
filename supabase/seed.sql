-- ============================================================
-- Seed: Initial shelves for the store
-- Customize codes and zones to match your actual warehouse
-- ============================================================

insert into public.shelves (code, label, zone) values
  ('A1', 'Anaquel A1', 'Running'),
  ('A2', 'Anaquel A2', 'Running'),
  ('A3', 'Anaquel A3', 'Running'),
  ('B1', 'Anaquel B1', 'Futbol'),
  ('B2', 'Anaquel B2', 'Futbol'),
  ('B3', 'Anaquel B3', 'Futbol'),
  ('C1', 'Anaquel C1', 'Casual'),
  ('C2', 'Anaquel C2', 'Casual'),
  ('D1', 'Anaquel D1', 'Accesorios'),
  ('D2', 'Anaquel D2', 'Accesorios')
on conflict (code) do nothing;

-- ============================================================
-- Sample products (for testing)
-- ============================================================

insert into public.products (sku, barcode, reference, name, size, color, category) values
  ('HQ8707-410', '4064057886687', 'HQ8707', 'Ultraboost 22 Running', '42', 'Core Black', 'Running'),
  ('GZ1900-080', '4065419394016', 'GZ1900', 'Adizero Adios Pro 3', '40', 'Cloud White', 'Running'),
  ('GW8999-420', '4066751282558', 'GW8999', 'Copa Pure.3 FG Football', '43', 'Solar Yellow', 'Futbol'),
  ('H03905-001', '4064044964458', 'H03905', 'Stan Smith Classic', '44', 'White/Green', 'Casual'),
  ('GX1711-060', '4064048124378', 'GX1711', 'Forum Low Sneaker', '41', 'Core Black', 'Casual')
on conflict (sku) do nothing;
