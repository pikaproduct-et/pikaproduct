// Hand-written types matching supabase/migrations/*.sql.
// Once the project is linked to a real Supabase instance, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts
// and this file becomes redundant. The shape below (Relationships/Views/
// Enums/CompositeTypes included, even empty) matches what that command
// produces — @supabase/supabase-js's generic constraints need the full
// shape or type inference on .from()/.rpc() silently collapses to `never`.

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
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category: string;
          sub_category: string | null;
          name: string;
          unit: string;
          attributes: Record<string, unknown>;
          sms_code: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          category: string;
          name: string;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "listings_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "stock_state_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: true;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: Partial<{ user_id: string; created_at: string }>;
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          listing_id: string;
          buyer_name: string;
          buyer_phone: string;
          quantity_requested: number;
          pickup_within_hours: number;
          note: string | null;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          responded_at: string | null;
          responded_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["reservations"]["Row"]> & {
          listing_id: string;
          buyer_name: string;
          buyer_phone: string;
          quantity_requested: number;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reservations_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      listing_status: {
        Row: {
          listing_id: string;
          supplier_id: string;
          product_id: string;
          price_per_unit: number;
          currency: string;
          is_active: boolean;
          product_name: string;
          product_unit: string;
          product_category: string;
          product_sms_code: string | null;
          freshness_window_hours: number;
          quantity: number | null;
          confidence_timestamp: string | null;
          updated_by: StockUpdateSource | null;
          freshness_status: "fresh" | "aging" | "stale" | "unconfirmed";
        };
        Relationships: [];
      };
    };
    Functions: {
      search_listings: {
        Args: {
          p_lat: number | null;
          p_lng: number | null;
          p_category: string | null;
          p_product_id: string | null;
          p_radius_km: number | null;
        };
        Returns: {
          listing_id: string;
          supplier_id: string;
          business_name: string;
          phone: string;
          sub_city: string | null;
          woreda: string | null;
          distance_km: number | null;
          product_id: string;
          product_name: string;
          product_unit: string;
          product_category: string;
          price_per_unit: number;
          currency: string;
          quantity: number | null;
          confidence_timestamp: string | null;
          freshness_status: "fresh" | "aging" | "stale" | "unconfirmed";
        }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      upsert_stock_state: {
        Args: {
          p_listing_id: string;
          p_quantity: number;
          p_confidence_timestamp: string;
          p_updated_by: string;
        };
        Returns: Database["public"]["Tables"]["stock_state"]["Row"];
      };
      upsert_own_supplier: {
        Args: {
          p_business_name: string;
          p_phone: string;
          p_city: string;
          p_sub_city: string | null;
          p_woreda: string | null;
          p_lat: number | null;
          p_lng: number | null;
        };
        Returns: Database["public"]["Tables"]["suppliers"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
