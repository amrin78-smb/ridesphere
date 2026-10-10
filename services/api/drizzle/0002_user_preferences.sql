CREATE TYPE "public"."experience_level" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."riding_pace" AS ENUM('relaxed', 'steady', 'brisk', 'fast');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bike_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"riding_styles" text[] DEFAULT '{}'::text[] NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"pace" "riding_pace",
	"experience" "experience_level",
	"distance_min_km" integer,
	"distance_max_km" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_distance_range" CHECK (("user_preferences"."distance_min_km" is null or "user_preferences"."distance_min_km" between 1 and 400)
        and ("user_preferences"."distance_max_km" is null or "user_preferences"."distance_max_km" between 1 and 400)
        and ("user_preferences"."distance_min_km" is null or "user_preferences"."distance_max_km" is null
          or "user_preferences"."distance_min_km" <= "user_preferences"."distance_max_km"))
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;