-- Amharic product names — added as a request from the user, per the
-- Ethiopian-market focus of the product: buyers/suppliers should see
-- product names in Amharic alongside English everywhere a name is
-- displayed, not just in English.
--
-- Kept as a separate name_am column rather than baked into `name`
-- itself, so English and Amharic stay independently searchable/
-- sortable, and individual translations can be corrected later
-- without touching the canonical English name used in SMS matching
-- (products.sms_code) or existing queries that filter/sort on `name`.
--
-- Translations use standard Ethiopian construction-trade terminology:
-- native Amharic where a common native term exists, transliteration/
-- loanwords for modern technical terms without an established native
-- equivalent (PPR, PVC, RHS, LED, aggregate, etc.) — this mirrors how
-- these items are actually named in hardware shops and construction
-- sites in Ethiopia today, not a literal dictionary translation.

alter table products add column name_am text;

update products as p
set name_am = v.name_am
from (values
  ('rebar_8mm', '8ሚ.ሜ የብረት ዘንግ'),
  ('rebar_10mm', '10ሚ.ሜ የብረት ዘንግ'),
  ('rebar_12mm', '12ሚ.ሜ የብረት ዘንግ'),
  ('rebar_16mm', '16ሚ.ሜ የብረት ዘንግ'),
  ('rebar_6mm', '6ሚ.ሜ የብረት ዘንግ (የሀገር ውስጥ)'),
  ('rebar_14mm', '14ሚ.ሜ የብረት ዘንግ'),
  ('rebar_20mm', '20ሚ.ሜ የብረት ዘንግ'),
  ('rebar_24mm', '24ሚ.ሜ የብረት ዘንግ'),
  ('rebar_32mm', '32ሚ.ሜ የብረት ዘንግ'),
  ('cement_opc', 'ተራ ፖርትላንድ ሲሚንቶ (ኦ.ፒ.ሲ)'),
  ('cement_ppc', 'ፖዞላና ፖርትላንድ ሲሚንቶ (ፒ.ፒ.ሲ)'),
  ('cement_dangote', 'ዳንጎቴ ሲሚንቶ'),
  ('cement_derba', 'ደርባ ሲሚንቶ'),
  ('cement_mugher', 'ሙገር ሲሚንቶ'),
  ('cement_ppc_habesha', 'ፒ.ፒ.ሲ ሲሚንቶ – ሀበሻ'),
  ('cement_ppc_ethiocement', 'ፒ.ፒ.ሲ ሲሚንቶ – ኢትዮ ሲሚንቶ'),
  ('cement_ppc_national', 'ናሽናል ሲሚንቶ ፒ.ፒ.ሲ'),
  ('agg_gypsum_powder', 'የሀገር ውስጥ ነጭ ጂፕሰም ዱቄት'),
  ('agg_river_sand', 'የወንዝ አሸዋ'),
  ('agg_red_ash', 'ቀይ አመድ (እሳተ ገሞራ ስኮሪያ)'),
  ('agg_aggregate_00', 'አግሬጌት 00 (ጥሩ የተፈጨ ድንጋይ)'),
  ('agg_aggregate_01', 'አግሬጌት 01 (መካከለኛ የተፈጨ ድንጋይ)'),
  ('agg_aggregate_02', 'አግሬጌት 02 (ሸካራ የተፈጨ ድንጋይ)'),
  ('agg_selected_material', 'የተመረጠ ሙሌት አፈር (ሰሌክትድ ማቴሪያል)'),
  ('agg_foundation_stones', 'የመሰረት ድንጋይ (የተጠረበ/ጥሬ)'),
  ('agg_hcb_10cm', 'ብሎኬት 10 ሳ.ሜ ውፍረት (ኤች.ሲ.ቢ)'),
  ('agg_hcb_15cm', 'ብሎኬት 15 ሳ.ሜ ውፍረት (ኤች.ሲ.ቢ)'),
  ('agg_hcb_20cm', 'ብሎኬት 20 ሳ.ሜ ውፍረት (ኤች.ሲ.ቢ)'),
  ('agg_hourdi_block', 'የሆርዲ ብሎኬት (ለሪብድ ወለል)'),
  ('agg_solid_concrete_block', 'ሙሉ ኮንክሪት ብሎኬት'),
  ('agg_clay_brick', 'የሸክላ ጡብ (6x12x24 ሳ.ሜ)'),
  ('agg_drainage_pipe_30cm', 'የፍሳሽ ማስተላለፊያ ኮንክሪት ቧንቧ (ዲያ 30 ሳ.ሜ)'),
  ('agg_drainage_pipe_60cm', 'የፍሳሽ ማስተላለፊያ ኮንክሪት ቧንቧ (ዲያ 60 ሳ.ሜ)'),
  ('agg_hydrated_lime', 'የደረቀ ኖራ (ጩና)'),
  ('agg_ready_mix_concrete', 'ዝግጁ ኮንክሪት ድብልቅ (የተለያዩ ደረጃዎች)'),
  ('agg_curing_compound', 'የኮንክሪት ኪዩሪንግ ኬሚካል'),
  ('steel_binding_wire_1_5mm', 'ጥቁር ማሰሪያ ሽቦ (1.5ሚሜ)'),
  ('steel_binding_wire_2_5mm', 'ጥቁር ማሰሪያ ሽቦ (2.5ሚሜ)'),
  ('steel_wire_mesh', 'ጋልቫናይዝድ የሽቦ መረብ (ፌንስ)'),
  ('steel_gabion_box', 'ገቢዮን ሳጥን (ለመሬት መከላከያ ግድግዳ)'),
  ('steel_barbed_wire', 'እሾሃማ ሽቦ'),
  ('steel_angle_iron_30x30', 'አንግል ብረት (30x30x3ሚሜ)'),
  ('steel_angle_iron_40x40', 'አንግል ብረት (40x40x3ሚሜ)'),
  ('steel_rhs_40x40', 'አራት ማዕዘን ቱቦ ብረት (RHS) 40x40x1.5ሚሜ'),
  ('steel_rhs_50x50', 'አራት ማዕዘን ቱቦ ብረት (RHS) 50x50x1.5ሚሜ'),
  ('steel_rhs_60x60', 'አራት ማዕዘን ቱቦ ብረት (RHS) 60x60x2ሚሜ'),
  ('steel_rhs_80x80', 'አራት ማዕዘን ቱቦ ብረት (RHS) 80x80x2.5ሚሜ'),
  ('steel_chs_beam', 'ክብ ቱቦ ብረት ጋርደር (CHS)'),
  ('steel_i_beam', 'አይ-ቢም (የግንባታ ብረት)'),
  ('steel_u_channel', 'ዩ-ቻናል ብረት ሀዲድ'),
  ('steel_sheet_metal_1mm', 'ላሜራ (1ሚሜ ውፍረት)'),
  ('steel_sheet_metal_2mm', 'ላሜራ (2ሚሜ ውፍረት)'),
  ('plumb_ppr_pipe_20mm', 'ፒ.ፒ.አር ቧንቧ (20ሚሜ)'),
  ('plumb_ppr_pipe_25mm', 'ፒ.ፒ.አር ቧንቧ (25ሚሜ)'),
  ('plumb_ppr_pipe_32mm', 'ፒ.ፒ.አር ቧንቧ (32ሚሜ)'),
  ('plumb_ppr_elbow_90', 'ፒ.ፒ.አር ክርን (90°)'),
  ('plumb_ppr_tee', 'ፒ.ፒ.አር ቲ-መገጣጠሚያ'),
  ('plumb_ppr_socket_adapter', 'ፒ.ፒ.አር ሶኬትና ገመድ መገጣጠሚያ'),
  ('plumb_pvc_sewer_4in', 'ፒ.ቪ.ሲ የፍሳሽ ቧንቧ (4 ኢንች)'),
  ('plumb_pvc_sewer_2in', 'ፒ.ቪ.ሲ የፍሳሽ ቧንቧ (2 ኢንች)'),
  ('plumb_pvc_ptrap_drain', 'ፒ.ቪ.ሲ ፒ-ትራፕና የወለል ፍሳሽ'),
  ('plumb_hdpe_pipe', 'ኤች.ዲ.ፒ.ኢ የውሃ ቧንቧ'),
  ('plumb_gate_valve', 'ጌት ቫልቭ (ናስ/ብሮንዝ)'),
  ('plumb_ball_valve', 'የመዝጊያ ቦል ቫልቭ'),
  ('plumb_flex_hose', 'ተለዋዋጭ የውሃ ማገናኛ ገመድ'),
  ('plumb_basin_pedestal', 'የእጅ መታጠቢያ ገንዳ (ፔዴስታል ዓይነት)'),
  ('plumb_vanity_sink', 'የካቢኔ ገንዳ (ቫኒቲ ሲንክ)'),
  ('plumb_wc_wall_mounted', 'በግድግዳ የተገጠመ ሽንት ቤት (ደብሊው.ሲ)'),
  ('plumb_wc_floor_standing', 'በወለል ላይ የሚቆም ፒ-ትራፕ ሽንት ቤት'),
  ('plumb_squat_toilet', 'የቱርክ ስታይል ሽንት ቤት'),
  ('plumb_toilet_seat', 'የሽንት ቤት መቀመጫና ማጠቢያ'),
  ('plumb_kitchen_sink_single', 'የኩሽና ሲንክ (ነጠላ ገንዳ) ስቴንለስ ስቲል'),
  ('plumb_kitchen_sink_double', 'የኩሽና ሲንክ (ድርብ ገንዳ) ስቴንለስ ስቲል'),
  ('plumb_basin_tap', 'የክሮም ገንዳ ቧንቧ (ቧንቧ መያዣ)'),
  ('plumb_mixer_tap', 'ሙቅና ቀዝቃዛ ውሃ መቀላቀያ ቧንቧ'),
  ('plumb_shower_head', 'ተለዋዋጭ የሻወር ራስና ገመድ'),
  ('plumb_shower_tray', 'የአክሬሊክ ሻወር ትሪ'),
  ('plumb_shower_enclosure', 'የጠንካራ መስታወት ሻወር ካቢን'),
  ('plumb_water_heater_30l', 'የኤሌክትሪክ ውሃ ማሞቂያ (30 ሊትር)'),
  ('plumb_water_heater_50l', 'የኤሌክትሪክ ውሃ ማሞቂያ (50 ሊትር)'),
  ('plumb_led_mirror', 'የመታጠቢያ ቤት መስተዋት ከኤል.ኢ.ዲ መብራት ጋር'),
  ('plumb_water_tank_1000l', 'የፕላስቲክ ውሃ ማጠራቀሚያ ገንዳ (1,000 ሊትር)'),
  ('plumb_water_tank_5000l', 'የፕላስቲክ ውሃ ማጠራቀሚያ ገንዳ (5,000 ሊትር)'),
  ('plumb_booster_pump', 'የውሃ ግፊት ማሳደጊያ ፓምፕ'),
  ('plumb_bathroom_accessories', 'የሽንት ቤት ወረቀት መያዣና ፎጣ ማንጠልጠያ (ስቴንለስ ስቲል)'),
  ('plumb_siphon_pump_kit', 'ሳይፎን ፓምፕና የቆሻሻ ውሃ ቧንቧ ኪት'),
  ('plumb_teflon_tape', 'የቴፍሎን ቧንቧ ማተሚያ ቴፕ'),
  ('elec_wire_1_5mm', 'የተከደነ የመዳብ ሽቦ (1.5ሚሜ² ለመብራት)'),
  ('elec_wire_2_5mm', 'የተከደነ የመዳብ ሽቦ (2.5ሚሜ² ለሶኬት)'),
  ('elec_wire_4mm', 'የተከደነ የመዳብ ሽቦ (4ሚሜ² ለከባድ እቃዎች)'),
  ('elec_grounding_rod', 'የመሬት ማገናኛ ዘንግና የመዳብ ሽቦ'),
  ('elec_pvc_conduit', 'ጠንካራ ፒ.ቪ.ሲ ቱቦ (ተጣጣፊ ብርቱካናማ/ጥቁር ጥቅል)'),
  ('elec_junction_box', 'የኤሌክትሪክ መገናኛ ሳጥን'),
  ('elec_skatola', 'ስካቶላ (በግድግዳ የሚገጠም የቁልፍ ሳጥን)'),
  ('elec_switch_single', 'ነጠላ የመብራት ቁልፍ'),
  ('elec_switch_double', 'ድርብ የመብራት ቁልፍ'),
  ('elec_socket_13a', '13 አምፔር የግድግዳ ሶኬት (ብሪቲሽ ስታንዳርድ)'),
  ('elec_socket_15a', '15 አምፔር ስማርት ሶኬት (ለውሃ ማሞቂያ/ምድጃ)'),
  ('elec_mcb', 'አነስተኛ የወረዳ መቋረጫ (ኤም.ሲ.ቢ – 16A, 20A, 32A)'),
  ('elec_distribution_board', 'ዋና የኤሌክትሪክ ማከፋፈያ ሰሌዳ (ኮንዚውመር ዩኒት)'),
  ('elec_rcd', 'የመሬት ፍሳሽ መከላከያ (አር.ሲ.ዲ)'),
  ('elec_led_panel', 'ኤል.ኢ.ዲ ፓነል መብራት (የሚቀበር፣ 12W/18W)'),
  ('elec_led_ceiling', 'በጣሪያ ላይ የሚገጠም ኤል.ኢ.ዲ መብራት'),
  ('elec_chandelier', 'ቻንደሊየርና ያጌጠ የመስቀያ መብራት'),
  ('elec_outdoor_light', 'የውጭ ግድግዳ ላይ የሚገጠም ውሃ የማያስገባ መብራት'),
  ('elec_floodlight', 'የኢንዱስትሪ ፍላድላይት (ኤል.ኢ.ዲ)'),
  ('elec_track_light', 'ትራክ መብራት ሀዲድና ስፖትላይት'),
  ('elec_insulation_tape', 'የኤሌክትሪክ መከላከያ ቴፕ (ፒ.ቪ.ሲ)'),
  ('elec_doorbell', 'የበር ደወል'),
  ('elec_led_tube', 'ቲ5/ቲ8 ኤል.ኢ.ዲ ቱብ መብራት'),
  ('elec_voltage_stabilizer', 'የቮልቴጅ ማረጋጊያ (ለቤት ጥበቃ)'),
  ('elec_coaxial_cable', 'የቴሌቪዥን ኮአክሲያል ገመድ'),
  ('roof_cgi_gauge28', 'ኮሩጌትድ ቆርቆሮ (ጌጅ 28)'),
  ('roof_cgi_gauge30', 'ኮሩጌትድ ቆርቆሮ (ጌጅ 30)'),
  ('roof_cgi_gauge32', 'ኮሩጌትድ ቆርቆሮ (ጌጅ 32)'),
  ('roof_ega_300', 'ኢጋ 300 ጣሪያ ሽፋን (0.4ሚሜ ውፍረት)'),
  ('roof_ega_400', 'ኢጋ 400 ጣሪያ ሽፋን (0.4ሚሜ ውፍረት)'),
  ('roof_ega_500', 'ኢጋ 500 ጣሪያ ሽፋን'),
  ('roof_decra_tile', 'ደክራ-መሳይ የተቀባ ጣሪያ ሽፋን (አዳማ ስታይል)'),
  ('roof_pvc_translucent', 'ፒ.ቪ.ሲ ግልጽ ጣሪያ ሽፋን (ብርሃን ማሳለፊያ)'),
  ('roof_j_bolt', 'የጣሪያ ጄ-ቦልትና ዋሸር'),
  ('roof_bitumen_membrane', 'የቢቱመን ውሃ መከላከያ ሽፋን (ተቃጣይ ጥቅል)'),
  ('roof_liquid_waterproof', 'ፈሳሽ ውሃ መከላከያ ድብልቅ (ሲሚንቶ ነክ)'),
  ('roof_glass_wool', 'የመስታወት ሱፍ መከላከያ ጥቅል'),
  ('roof_ridge_flashing', 'የጣሪያ አናት ሽፋንና ፍላሺንግ (ጋልቫናይዝድ)'),
  ('roof_pvc_gutter', 'ፒ.ቪ.ሲ የዝናብ ውሃ ማስተላለፊያ'),
  ('roof_downspout', 'የዝናብ ውሃ ማውረጃ ቧንቧና መያዣ'),
  ('fin_marble_local', 'የሀገር ውስጥ እብነ በረድ (ወለጋ/ሳባ – 2ሳ.ሜ ውፍረት)'),
  ('fin_granite_imported', 'ከውጭ የገባ ግራናይት ካውንተር (ፊሽ ብላክ፣ አብሶሉት ብላክ)'),
  ('fin_terrazzo_tile', 'ተራዞ ንጣፍ (40x40x3 ሳ.ሜ)'),
  ('fin_ceramic_wall_tile', 'የግድግዳ ሴራሚክ ንጣፍ (30x60 ሳ.ሜ)'),
  ('fin_porcelain_floor_tile', 'የወለል ፖርሴሊን ንጣፍ (60x60 ሳ.ሜ)'),
  ('fin_parquet_flooring', 'የእንጨት ፓርኬት ወለል'),
  ('fin_tile_adhesive', 'የንጣፍ ማጣበቂያ ሲሚንቶ (C1/C2)'),
  ('fin_tile_grout', 'የንጣፍ ማገጣጠሚያ ዱቄት (የተለያዩ ቀለማት)'),
  ('fin_gypsum_board', 'ጂፕሰም ቦርድ (1.22 x 2.44 ሜ)'),
  ('fin_gypsum_studs_tracks', 'ጂፕሰም ስተድና ትራክ (የብረት ፍሬም)'),
  ('fin_pvc_ceiling_panel', 'ፒ.ቪ.ሲ የጣሪያ ፓነል'),
  ('fin_pvc_skirting', 'ፒ.ቪ.ሲ ስከርቲንግ (ዘኮሎ)'),
  ('fin_paint_emulsion', 'የፕላስቲክ ቀለም (ውስጣዊ ግድግዳ)'),
  ('fin_paint_weathercoat', 'ዌዘርኮት የግድግዳ ቀለም (ውጫዊ)'),
  ('fin_paint_antirust_primer', 'ፀረ-ዝገት ፕራይመር ቀለም (ለብረት)'),
  ('fin_paint_thinner', 'የቀለም ማቅለጫ (ቲነር)'),
  ('fin_wall_putty', 'ግድግዳ ማለስለሻ ዱቄት (እንዱይል)'),
  ('fin_glass_clear_4mm', 'ግልጽ ብርጭቆ (4ሚሜ ውፍረት)'),
  ('fin_glass_tinted_5mm', 'ቀለም ያለው/አንጸባራቂ የመስኮት ብርጭቆ (5ሚሜ ውፍረት)'),
  ('door_wooden_flush', 'የእንጨት ጠፍጣፋ በር (ኤም.ዲ.ኤፍ/ኤች.ዲ.ኤፍ)'),
  ('door_steel_security', 'ቪክቶር-ስታይል የብረት ደህንነት በር'),
  ('window_aluminum_frame', 'የአሉሚኒየም መስኮት ፍሬም'),
  ('door_aluminum_sliding_track', 'የአሉሚኒየም ተንሸራታች በር ሀዲድ'),
  ('door_mortise_lock', 'የሲሊንደር በር ቁልፍ (ሞርቲስ ሎክ)'),
  ('door_brass_hinge', 'ከባድ ስራ የናስ በር መገጣጠሚያ (ሆኖ)')
) as v(sub_category, name_am)
where p.sub_category = v.sub_category;

-- Every product must end up with a translation — fail loudly at
-- migration time rather than silently shipping an English-only row.
do $$
declare
  missing_count int;
begin
  select count(*) into missing_count from products where name_am is null;
  if missing_count > 0 then
    raise exception '% products are missing an Amharic name_am translation', missing_count;
  end if;
end $$;

alter table products alter column name_am set not null;

-- ============================================================
-- listing_status (originally migration 0005) and search_listings
-- (originally 0007, extended in 0009 with p_limit) both need to expose
-- product_name_am so every UI surface built on top of them (supplier
-- dashboard, buyer search/compare) can render "English (Amharic)"
-- without a second round-trip to the products table.
-- ============================================================
-- Postgres only allows CREATE OR REPLACE VIEW to append new output
-- columns at the very end of the list — inserting product_name_am
-- between product_name and product_unit (as an earlier draft of this
-- migration did) shifts every column after it and Postgres rejects
-- that as an implicit rename (SQLSTATE 42P16). So product_name_am is
-- appended last here, after freshness_status, keeping every original
-- column in its original position.
create or replace view listing_status
with (security_invoker = true) as
select
  l.id as listing_id,
  l.supplier_id,
  l.product_id,
  l.price_per_unit,
  l.currency,
  l.is_active,
  p.name as product_name,
  p.unit as product_unit,
  p.category as product_category,
  p.sms_code as product_sms_code,
  p.freshness_window_hours,
  ss.quantity,
  ss.confidence_timestamp,
  ss.updated_by,
  case
    when ss.confidence_timestamp is null then 'unconfirmed'
    when extract(epoch from (now() - ss.confidence_timestamp)) <= p.freshness_window_hours * 3600 then 'fresh'
    when extract(epoch from (now() - ss.confidence_timestamp)) <= p.freshness_window_hours * 2 * 3600 then 'aging'
    else 'stale'
  end as freshness_status,
  p.name_am as product_name_am
from listings l
join products p on p.id = l.product_id
left join stock_state ss on ss.listing_id = l.id;

grant select on listing_status to authenticated, anon;

-- Unlike views, CREATE OR REPLACE FUNCTION can't change a function's
-- return type at all (SQLSTATE 42P13) — not even by appending a
-- column to a RETURNS TABLE list. The existing 6-arg search_listings
-- (from migration 0009) has to be dropped before it can be recreated
-- with product_name_am in its return table.
drop function if exists search_listings(double precision, double precision, text, uuid, double precision, int);

create function search_listings(
  p_lat double precision default null,
  p_lng double precision default null,
  p_category text default null,
  p_product_id uuid default null,
  p_radius_km double precision default 25,
  p_limit int default 15
)
returns table (
  listing_id uuid,
  supplier_id uuid,
  business_name text,
  phone text,
  sub_city text,
  woreda text,
  distance_km double precision,
  product_id uuid,
  product_name text,
  product_unit text,
  product_category text,
  price_per_unit numeric,
  currency text,
  quantity numeric,
  confidence_timestamp timestamptz,
  freshness_status text,
  product_name_am text
)
language sql
stable
security invoker
as $$
  select
    ls.listing_id,
    ls.supplier_id,
    s.business_name,
    s.phone,
    s.sub_city,
    s.woreda,
    case
      when p_lat is not null and p_lng is not null and s.location is not null then
        ST_Distance(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0
      else null
    end as distance_km,
    ls.product_id,
    ls.product_name,
    ls.product_unit,
    ls.product_category,
    ls.price_per_unit,
    ls.currency,
    ls.quantity,
    ls.confidence_timestamp,
    ls.freshness_status,
    ls.product_name_am
  from listing_status ls
  join suppliers s on s.id = ls.supplier_id
  where ls.is_active
    and s.verification_status = 'verified'
    and (p_category is null or ls.product_category = p_category)
    and (p_product_id is null or ls.product_id = p_product_id)
    and (
      p_lat is null or p_lng is null or s.location is null
      or ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
    )
  order by
    (case
      when p_lat is not null and p_lng is not null and s.location is not null then
        ST_Distance(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
      else null
    end) asc nulls last,
    ls.product_name asc
  limit greatest(1, least(p_limit, 50));
$$;

grant execute on function search_listings(double precision, double precision, text, uuid, double precision, int)
  to anon, authenticated;
