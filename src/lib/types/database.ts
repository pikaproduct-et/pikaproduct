// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked to a real Supabase instance, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts
// and this file becomes redundant.

export type VerificationStatus = "pending" | "verified" | "rejected";
export type StockUpdateSource = "app" | "sms" | "ussd" | "admin";

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string;
          owner_id: string | null;
          business_name: string;
          phone: string;
          woreda: string | null;
          sub_city: string | null;
          city: string;
          location: unknown | null; // PostGIS geography(point) — use a geo helper to parse
          verification_status: VerificationStatus;
          verified_at: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["suppliers"]["Row"]> & {
          business_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          category: string;
          sub_category: string | null;
          name: string;
          unit: string;
          attributes: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          category: string;
          name: string;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      listings: {
        Row: {
          id: string;
          supplier_id: string;
          product_id: string;
          price_per_unit: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["listings"]["Row"]> & {
          supplier_id: string;
          product_id: string;
          price_per_unit: number;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Row"]>;
      };
      stock_state: {
        Row: {
          listing_id: string;
          quantity: number;
          confidence_timestamp: string;
          updated_by: StockUpdateSource;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stock_state"]["Row"]> & {
          listing_id: string;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["stock_state"]["Row"]>;
      };
    };
  };
}
