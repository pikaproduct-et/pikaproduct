-- Starter product taxonomy — deliberately limited to rebar and cement
-- (highest frequency, most standardized SKUs — see blueprint Section 4,
-- "Build first" item 4). Expand categories only after these two prove out.

insert into products (category, sub_category, name, unit, attributes) values
  ('rebar', 'rebar_8mm',  '8mm Rebar',  'quintal', '{"diameter_mm": 8}'),
  ('rebar', 'rebar_10mm', '10mm Rebar', 'quintal', '{"diameter_mm": 10}'),
  ('rebar', 'rebar_12mm', '12mm Rebar', 'quintal', '{"diameter_mm": 12}'),
  ('rebar', 'rebar_16mm', '16mm Rebar', 'quintal', '{"diameter_mm": 16}'),
  ('cement', 'cement_opc', 'Ordinary Portland Cement (OPC)', 'bag_50kg', '{"grade": "OPC"}'),
  ('cement', 'cement_ppc', 'Portland Pozzolana Cement (PPC)', 'bag_50kg', '{"grade": "PPC"}'),
  ('cement', 'cement_dangote', 'Dangote Cement', 'bag_50kg', '{"brand": "Dangote"}'),
  ('cement', 'cement_derba', 'Derba Cement', 'bag_50kg', '{"brand": "Derba"}'),
  ('cement', 'cement_mugher', 'Mugher Cement', 'bag_50kg', '{"brand": "Mugher"}')
on conflict do nothing;
