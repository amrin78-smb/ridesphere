CREATE TYPE "public"."meeting_detail_visibility" AS ENUM('public', 'members', 'participants');--> statement-breakpoint
CREATE TYPE "public"."ride_difficulty" AS ENUM('easy', 'moderate', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."ride_status" AS ENUM('draft', 'published', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."ride_terrain" AS ENUM('road', 'gravel', 'trail', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."ride_visibility" AS ENUM('public', 'members', 'private');--> statement-breakpoint
CREATE TABLE "rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid,
	"organiser_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"timezone" text NOT NULL,
	"area" text NOT NULL,
	"bike_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"terrain" "ride_terrain" NOT NULL,
	"pace" "riding_pace" NOT NULL,
	"difficulty" "ride_difficulty" NOT NULL,
	"distance_m" integer NOT NULL,
	"elevation_m" integer,
	"capacity" integer,
	"requirements" text DEFAULT '' NOT NULL,
	"cancellation_policy" text DEFAULT '' NOT NULL,
	"meeting_point_name" text NOT NULL,
	"meeting_point_details" text DEFAULT '' NOT NULL,
	"meeting_details_visible_to" "meeting_detail_visibility" DEFAULT 'members' NOT NULL,
	"visibility" "ride_visibility" DEFAULT 'public' NOT NULL,
	"status" "ride_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rides_distance_positive" CHECK ("rides"."distance_m" > 0),
	CONSTRAINT "rides_elevation_not_negative" CHECK ("rides"."elevation_m" is null or "rides"."elevation_m" >= 0),
	CONSTRAINT "rides_capacity_positive" CHECK ("rides"."capacity" is null or "rides"."capacity" > 0),
	CONSTRAINT "rides_ends_after_start" CHECK ("rides"."ends_at" is null or "rides"."ends_at" > "rides"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_organiser_id_user_id_fk" FOREIGN KEY ("organiser_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rides_discovery_idx" ON "rides" USING btree ("status","starts_at","id");