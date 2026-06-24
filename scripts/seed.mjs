// Seed a test account + sample profile into the configured MongoDB.
// Usage: npm run seed
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load variables from .env.local into process.env (only those not already set).
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* .env.local optional if vars already in environment */
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set (.env.local).");
  process.exit(1);
}

// Schemas mirror src/models/* so we write to the same collections (users, profiles).
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "cashier", "server", "kitchen"], default: "server" },
  },
  { timestamps: true }
);
const ProfileSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    firstName: String,
    lastName: String,
    email: String,
    countryCode: String,
    mobile: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);

const TEST_USER = { username: "testadmin", password: "Test@1234" };
const SAMPLE_PROFILE = {
  key: "primary",
  firstName: "Test",
  lastName: "User",
  email: "test@spicyocean.local",
  countryCode: "+91",
  mobile: "90000-00000",
};

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to:", mongoose.connection.name);

  const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
  await User.findOneAndUpdate(
    { username: TEST_USER.username },
    { $set: { passwordHash, role: "owner" }, $setOnInsert: { username: TEST_USER.username } },
    { upsert: true, new: true }
  );
  console.log(`✓ Test user ready -> username: ${TEST_USER.username} / password: ${TEST_USER.password} (role: owner)`);

  await Profile.findOneAndUpdate(
    { key: "primary" },
    { $set: SAMPLE_PROFILE },
    { upsert: true, new: true }
  );
  console.log("✓ Sample profile seeded:", `${SAMPLE_PROFILE.firstName} ${SAMPLE_PROFILE.lastName}`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
