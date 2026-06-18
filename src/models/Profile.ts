import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ProfileSchema = new Schema(
  {
    // A stable key so we can treat the profile as a singleton document.
    key: { type: String, required: true, unique: true, default: "primary" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    countryCode: { type: String, required: true, trim: true, default: "+91" },
    mobile: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type ProfileDoc = InferSchemaType<typeof ProfileSchema>;

// Avoid model overwrite errors during Next.js hot-reload.
export const Profile: Model<ProfileDoc> =
  (mongoose.models.Profile as Model<ProfileDoc>) ||
  mongoose.model<ProfileDoc>("Profile", ProfileSchema);

// Default values used to seed the singleton profile on first read.
export const DEFAULT_PROFILE = {
  key: "primary",
  firstName: "Rajesh",
  lastName: "Kolluri",
  email: "rajesh.kolluri@touchalife.org",
  countryCode: "+91",
  mobile: "88865-56554",
};
