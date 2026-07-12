-- Expand product taxonomy: 143 new SKUs across 6 new categories plus
-- additional rebar sizes and cement brands, per the supplied catalog.
-- Every row here was checked in generation against the existing 9 seeded
-- products (migration 0002) — Dangote/Derba/Mugher OPC and 8/10/12/16mm
-- rebar were already seeded and are intentionally skipped, not
-- duplicated. A unique constraint on sub_category (added below) is the
-- DB-level backstop against duplicates going forward, on top of that
-- generation-time check.
--
-- A caveat worth being explicit about: the SMS stock-update path
-- (migration 0003) only scales to a curated handful of SKUs a supplier
-- can realistically remember or look up — see the blueprint's rationale
-- for starting with a narrow taxonomy. Of these 143 new products, only
-- the new rebar sizes get sms_code values, matching the existing
-- pattern; the other 138 are app/web-only for now. Assign more SMS
-- codes deliberately if specific ones turn out to be high-frequency
-- enough to justify it.

alter table products add constraint products_sub_category_unique unique (sub_category);

insert into products (category, sub_category, name, unit, attributes, sms_code) values
  ('cement', 'cement_ppc_habesha', 'Portland Pozzolana Cement (PPC) – Habesha', 'bag_50kg', '{"brand": "Habesha"}'::jsonb, null),
  ('cement', 'cement_ppc_ethiocement', 'Portland Pozzolana Cement (PPC) – Ethio Cement', 'bag_50kg', '{"brand": "Ethio Cement"}'::jsonb, null),
  ('cement', 'cement_ppc_national', 'National Cement PPC', 'bag_50kg', '{"brand": "National Cement"}'::jsonb, null),
  ('aggregates_blocks', 'agg_gypsum_powder', 'Local White Gypsum Powder', 'bag', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_river_sand', 'River Sand', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_red_ash', 'Red Ash (Volcanic Scoria)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_aggregate_00', 'Aggregate 00 (Fine crushed stone)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_aggregate_01', 'Aggregate 01 (Medium crushed stone)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_aggregate_02', 'Aggregate 02 (Coarse crushed stone)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_selected_material', 'Selected Material (Sub-base filling soil)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_foundation_stones', 'Foundation Stones (Chiseled/Raw)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_hcb_10cm', 'Hollow Concrete Block (HCB) – 10cm thick', 'piece', '{"thickness_cm": 10}'::jsonb, null),
  ('aggregates_blocks', 'agg_hcb_15cm', 'Hollow Concrete Block (HCB) – 15cm thick', 'piece', '{"thickness_cm": 15}'::jsonb, null),
  ('aggregates_blocks', 'agg_hcb_20cm', 'Hollow Concrete Block (HCB) – 20cm thick', 'piece', '{"thickness_cm": 20}'::jsonb, null),
  ('aggregates_blocks', 'agg_hourdi_block', 'HCB for Ribbed Slabs (Hourdi blocks)', 'piece', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_solid_concrete_block', 'Solid Concrete Blocks', 'piece', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_clay_brick', 'Clay Bricks (6x12x24 cm)', 'piece', '{"dimensions_cm": "6x12x24"}'::jsonb, null),
  ('aggregates_blocks', 'agg_drainage_pipe_30cm', 'Precast Concrete Drainage Pipes (Dia 30cm)', 'piece', '{"diameter_cm": 30}'::jsonb, null),
  ('aggregates_blocks', 'agg_drainage_pipe_60cm', 'Precast Concrete Drainage Pipes (Dia 60cm)', 'piece', '{"diameter_cm": 60}'::jsonb, null),
  ('aggregates_blocks', 'agg_hydrated_lime', 'Hydrated Lime (Chuna)', 'bag', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_ready_mix_concrete', 'Ready-Mix Concrete (Various grades, e.g. C-25, C-30)', 'm3', '{}'::jsonb, null),
  ('aggregates_blocks', 'agg_curing_compound', 'Concrete Curing Compound', 'liter', '{}'::jsonb, null),
  ('rebar', 'rebar_6mm', '6mm Deformed Rebar (Local)', 'quintal', '{"diameter_mm": 6}'::jsonb, 'REBAR6'),
  ('rebar', 'rebar_14mm', '14mm Deformed Rebar', 'quintal', '{"diameter_mm": 14}'::jsonb, 'REBAR14'),
  ('rebar', 'rebar_20mm', '20mm Deformed Rebar', 'quintal', '{"diameter_mm": 20}'::jsonb, 'REBAR20'),
  ('rebar', 'rebar_24mm', '24mm Deformed Rebar', 'quintal', '{"diameter_mm": 24}'::jsonb, 'REBAR24'),
  ('rebar', 'rebar_32mm', '32mm Deformed Rebar', 'quintal', '{"diameter_mm": 32}'::jsonb, 'REBAR32'),
  ('structural_steel', 'steel_binding_wire_1_5mm', 'Black Binding Wire (1.5mm)', 'kg', '{}'::jsonb, null),
  ('structural_steel', 'steel_binding_wire_2_5mm', 'Black Binding Wire (2.5mm)', 'kg', '{}'::jsonb, null),
  ('structural_steel', 'steel_wire_mesh', 'Galvanized Wire Mesh (Fence mesh)', 'roll', '{}'::jsonb, null),
  ('structural_steel', 'steel_gabion_box', 'Gabion Boxes (for retaining walls)', 'piece', '{}'::jsonb, null),
  ('structural_steel', 'steel_barbed_wire', 'Barbed Wire', 'roll', '{}'::jsonb, null),
  ('structural_steel', 'steel_angle_iron_30x30', 'Angle Iron (30x30x3mm)', 'piece', '{"size_mm": "30x30x3"}'::jsonb, null),
  ('structural_steel', 'steel_angle_iron_40x40', 'Angle Iron (40x40x3mm)', 'piece', '{"size_mm": "40x40x3"}'::jsonb, null),
  ('structural_steel', 'steel_rhs_40x40', 'Rectangular Hollow Section (RHS) 40x40x1.5mm', 'piece', '{"size_mm": "40x40x1.5"}'::jsonb, null),
  ('structural_steel', 'steel_rhs_50x50', 'Rectangular Hollow Section (RHS) 50x50x1.5mm', 'piece', '{"size_mm": "50x50x1.5"}'::jsonb, null),
  ('structural_steel', 'steel_rhs_60x60', 'Rectangular Hollow Section (RHS) 60x60x2mm', 'piece', '{"size_mm": "60x60x2"}'::jsonb, null),
  ('structural_steel', 'steel_rhs_80x80', 'Rectangular Hollow Section (RHS) 80x80x2.5mm', 'piece', '{"size_mm": "80x80x2.5"}'::jsonb, null),
  ('structural_steel', 'steel_chs_beam', 'Circular Hollow Section (CHS) Beams', 'piece', '{}'::jsonb, null),
  ('structural_steel', 'steel_i_beam', 'I-Beams (Structural Steel)', 'piece', '{}'::jsonb, null),
  ('structural_steel', 'steel_u_channel', 'U-Channel Steel Rails', 'piece', '{}'::jsonb, null),
  ('structural_steel', 'steel_sheet_metal_1mm', 'Sheet Metal / Lamera (1mm thick)', 'piece', '{"thickness_mm": 1}'::jsonb, null),
  ('structural_steel', 'steel_sheet_metal_2mm', 'Sheet Metal / Lamera (2mm thick)', 'piece', '{"thickness_mm": 2}'::jsonb, null),
  ('plumbing', 'plumb_ppr_pipe_20mm', 'PPR Pipe (20mm)', 'piece', '{"diameter_mm": 20}'::jsonb, null),
  ('plumbing', 'plumb_ppr_pipe_25mm', 'PPR Pipe (25mm)', 'piece', '{"diameter_mm": 25}'::jsonb, null),
  ('plumbing', 'plumb_ppr_pipe_32mm', 'PPR Pipe (32mm)', 'piece', '{"diameter_mm": 32}'::jsonb, null),
  ('plumbing', 'plumb_ppr_elbow_90', 'PPR Elbows (90°)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_ppr_tee', 'PPR Equal Tees', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_ppr_socket_adapter', 'PPR Sockets & Threaded Adapters', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_pvc_sewer_4in', 'PVC Sewerage Pipe (4-inch)', 'piece', '{"diameter_in": 4}'::jsonb, null),
  ('plumbing', 'plumb_pvc_sewer_2in', 'PVC Sewerage Pipe (2-inch)', 'piece', '{"diameter_in": 2}'::jsonb, null),
  ('plumbing', 'plumb_pvc_ptrap_drain', 'PVC P-Traps & Floor Drains', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_hdpe_pipe', 'HDPE Water Supply Pipes', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_gate_valve', 'Gate Valves (Brass/Bronze)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_ball_valve', 'Shut-off Ball Valves', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_flex_hose', 'Flexible Hose Supply Lines', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_basin_pedestal', 'Ceramic Hand Wash Basin (Pedestal type)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_vanity_sink', 'Cabinet Vanity Sinks (Vitreous China)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_wc_wall_mounted', 'Wall-Mounted WC Toilets', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_wc_floor_standing', 'Floor-Standing P-Trap Toilets', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_squat_toilet', 'Turkish Squatting Toilets', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_toilet_seat', 'Toilet Seats & Flushing Mechanisms', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_kitchen_sink_single', 'Stainless Steel Kitchen Sink (Single Bowl)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_kitchen_sink_double', 'Stainless Steel Kitchen Sink (Double Bowl)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_basin_tap', 'Chrome Basin Taps / Faucets', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_mixer_tap', 'Mixer Taps (Hot & Cold for showers)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_shower_head', 'Flexible Shower Heads & Hoses', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_shower_tray', 'Acrylic Shower Trays', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_shower_enclosure', 'Tempered Glass Shower Enclosures/Boxes', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_water_heater_30l', 'Electric Water Heater (30-Liter)', 'piece', '{"capacity_l": 30}'::jsonb, null),
  ('plumbing', 'plumb_water_heater_50l', 'Electric Water Heater (50-Liter)', 'piece', '{"capacity_l": 50}'::jsonb, null),
  ('plumbing', 'plumb_led_mirror', 'Bathroom Mirrors with LED backlight', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_water_tank_1000l', 'Plastic Water Storage Tanks (1,000 Liters)', 'piece', '{"capacity_l": 1000}'::jsonb, null),
  ('plumbing', 'plumb_water_tank_5000l', 'Plastic Water Storage Tanks (5,000 Liters)', 'piece', '{"capacity_l": 5000}'::jsonb, null),
  ('plumbing', 'plumb_booster_pump', 'Water Pressure Booster Pumps', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_bathroom_accessories', 'Toilet Paper Holders & Towel Rings (Stainless steel)', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_siphon_pump_kit', 'Siphon Pumps & Waste Pipe Kits', 'piece', '{}'::jsonb, null),
  ('plumbing', 'plumb_teflon_tape', 'Teflon Pipe Thread Seal Tape', 'roll', '{}'::jsonb, null),
  ('electrical', 'elec_wire_1_5mm', 'Insulated Copper Wire (1.5mm² for lighting)', 'roll', '{"cross_section_mm2": 1.5}'::jsonb, null),
  ('electrical', 'elec_wire_2_5mm', 'Insulated Copper Wire (2.5mm² for sockets)', 'roll', '{"cross_section_mm2": 2.5}'::jsonb, null),
  ('electrical', 'elec_wire_4mm', 'Insulated Copper Wire (4mm² for heavy appliances)', 'roll', '{"cross_section_mm2": 4}'::jsonb, null),
  ('electrical', 'elec_grounding_rod', 'Earth/Grounding Rods & Copper Wire', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_pvc_conduit', 'Rigid PVC Conduits (Flexible orange/black coils)', 'roll', '{}'::jsonb, null),
  ('electrical', 'elec_junction_box', 'Electrical Junction Boxes', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_skatola', 'Skatola (Wall-recessed switch boxes)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_switch_single', 'Single-Gang Light Switch', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_switch_double', 'Double-Gang Light Switch', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_socket_13a', '13A Wall Sockets (British Standard)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_socket_15a', '15A Smart/Power Sockets (for water heaters/stoves)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_mcb', 'Miniature Circuit Breakers (MCB – 16A, 20A, 32A)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_distribution_board', 'Main Distribution Board (Consumer Unit box)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_rcd', 'Residual Current Devices (RCD / Earth leakage protection)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_led_panel', 'LED Panel Lights (Recessed, 12W/18W)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_led_ceiling', 'LED Surface-Mounted Ceiling Lights', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_chandelier', 'Chandelier & Decorative Pendant Lights', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_outdoor_light', 'Outdoor Wall-Mounted Waterproof Lights', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_floodlight', 'Industrial Floodlights (LED)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_track_light', 'Track Lighting Rails & Spotlights', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_insulation_tape', 'Electrical Insulation Tape (PVC)', 'roll', '{}'::jsonb, null),
  ('electrical', 'elec_doorbell', 'Doorbell Units', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_led_tube', 'T5/T8 LED Tube Light Fittings', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_voltage_stabilizer', 'Voltage Stabilizers (for whole-house protection)', 'piece', '{}'::jsonb, null),
  ('electrical', 'elec_coaxial_cable', 'TV Coaxial Cables', 'roll', '{}'::jsonb, null),
  ('roofing', 'roof_cgi_gauge28', 'Corrugated Galvanized Iron Roofing Sheet (Gauge 28)', 'piece', '{"gauge": 28}'::jsonb, null),
  ('roofing', 'roof_cgi_gauge30', 'Corrugated Galvanized Iron Roofing Sheet (Gauge 30)', 'piece', '{"gauge": 30}'::jsonb, null),
  ('roofing', 'roof_cgi_gauge32', 'Corrugated Galvanized Iron Roofing Sheet (Gauge 32)', 'piece', '{"gauge": 32}'::jsonb, null),
  ('roofing', 'roof_ega_300', 'EGA 300 Roof Sheets (0.4mm thick profile)', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_ega_400', 'EGA 400 Roof Sheets (0.4mm thick profile)', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_ega_500', 'EGA 500 Profile Roofing Sheets', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_decra_tile', 'Decra-Look Painted Roof Tiles (Adama style)', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_pvc_translucent', 'PVC Translucent Roofing Sheets (Skylights)', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_j_bolt', 'Roofing J-Bolts & Washers', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_bitumen_membrane', 'Bituminous Waterproofing Membrane (Torch-on rolls)', 'roll', '{}'::jsonb, null),
  ('roofing', 'roof_liquid_waterproof', 'Liquid Waterproofing Compound (Cementitious)', 'liter', '{}'::jsonb, null),
  ('roofing', 'roof_glass_wool', 'Glass Wool Insulation Rolls', 'roll', '{}'::jsonb, null),
  ('roofing', 'roof_ridge_flashing', 'Roof Ridges & Flashing Sheets (Galvanized)', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_pvc_gutter', 'PVC Rainwater Gutters', 'piece', '{}'::jsonb, null),
  ('roofing', 'roof_downspout', 'Downspout Pipes & Bracket Hooks', 'piece', '{}'::jsonb, null),
  ('finishing', 'fin_marble_local', 'Local Marble Slabs (Wolega/Saba – 2cm thick)', 'm2', '{}'::jsonb, null),
  ('finishing', 'fin_granite_imported', 'Imported Granite Countertops (Fish Black, Absolute Black)', 'm2', '{}'::jsonb, null),
  ('finishing', 'fin_terrazzo_tile', 'Terrazzo Tiles (40x40x3 cm)', 'm2', '{}'::jsonb, null),
  ('finishing', 'fin_ceramic_wall_tile', 'Ceramic Wall Tiles (30x60 cm)', 'm2', '{}'::jsonb, null),
  ('finishing', 'fin_porcelain_floor_tile', 'Porcelain Floor Tiles (60x60 cm)', 'm2', '{}'::jsonb, null),
  ('finishing', 'fin_parquet_flooring', 'Parquet Wooden Flooring Blocks', 'm2', '{}'::jsonb, null),
  ('finishing', 'fin_tile_adhesive', 'Tile Adhesive Mortar (C1/C2 bags)', 'bag', '{}'::jsonb, null),
  ('finishing', 'fin_tile_grout', 'Tile Grout Powder (Various colors)', 'bag', '{}'::jsonb, null),
  ('finishing', 'fin_gypsum_board', 'Gypsum Boards (1.22 x 2.44 m)', 'piece', '{}'::jsonb, null),
  ('finishing', 'fin_gypsum_studs_tracks', 'Gypsum Studs & Tracks (Metal framing)', 'piece', '{}'::jsonb, null),
  ('finishing', 'fin_pvc_ceiling_panel', 'PVC Ceiling Panels', 'piece', '{}'::jsonb, null),
  ('finishing', 'fin_pvc_skirting', 'PVC Skirting Tiles (Zekolo)', 'piece', '{}'::jsonb, null),
  ('finishing', 'fin_paint_emulsion', 'Acrylic Emulsion Plastic Paint (Interior walls)', 'liter', '{}'::jsonb, null),
  ('finishing', 'fin_paint_weathercoat', 'Weathercoat Quartz Paint (Exterior walls)', 'liter', '{}'::jsonb, null),
  ('finishing', 'fin_paint_antirust_primer', 'Anti-Rust Primer Paint (for metals)', 'liter', '{}'::jsonb, null),
  ('finishing', 'fin_paint_thinner', 'Paint Thinner & Solvents', 'liter', '{}'::jsonb, null),
  ('finishing', 'fin_wall_putty', 'Wall Putty / Enduil Powder', 'bag', '{}'::jsonb, null),
  ('finishing', 'fin_glass_clear_4mm', 'Clear Float Glass Panes (4mm thick)', 'm2', '{"thickness_mm": 4}'::jsonb, null),
  ('finishing', 'fin_glass_tinted_5mm', 'Tinted/Reflective Window Glass (5mm thick)', 'm2', '{"thickness_mm": 5}'::jsonb, null),
  ('doors_windows', 'door_wooden_flush', 'Wooden Flush Doors (MDF/HDF veneers)', 'piece', '{}'::jsonb, null),
  ('doors_windows', 'door_steel_security', 'Victor-Style Steel Security Doors', 'piece', '{}'::jsonb, null),
  ('doors_windows', 'window_aluminum_frame', 'Aluminum Window Frame Profiles', 'piece', '{}'::jsonb, null),
  ('doors_windows', 'door_aluminum_sliding_track', 'Aluminum Sliding Door Tracks', 'piece', '{}'::jsonb, null),
  ('doors_windows', 'door_mortise_lock', 'Cylindrical Mortise Door Locks', 'piece', '{}'::jsonb, null),
  ('doors_windows', 'door_brass_hinge', 'Heavy-Duty Brass Door Hinges', 'piece', '{}'::jsonb, null)
on conflict (sub_category) do nothing;

-- Category-specific freshness windows (see migration 0005) for the new
-- categories, following the same fast-moving vs. slow-moving logic as
-- the original rebar (48h) / cement (120h) split. Must run after the
-- insert above — these categories don't exist in the table before then,
-- so rows would otherwise keep the column's 72h default instead.
-- Adjust per real turnover data once suppliers are live.
update products set freshness_window_hours = 48  where category = 'aggregates_blocks';
update products set freshness_window_hours = 72  where category = 'structural_steel';
update products set freshness_window_hours = 96  where category = 'plumbing';
update products set freshness_window_hours = 96  where category = 'electrical';
update products set freshness_window_hours = 120 where category = 'roofing';
update products set freshness_window_hours = 120 where category = 'finishing';
update products set freshness_window_hours = 168 where category = 'doors_windows';
