import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const MenuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    // FOOD = Dine-In / Take Away menu; TEA_SNACKS = Tea & Snacks menu.
    kind: { type: String, enum: ["FOOD", "TEA_SNACKS"], default: "FOOD", index: true },
  },
  { timestamps: true }
);

export type MenuItemDoc = InferSchemaType<typeof MenuItemSchema>;

export const MenuItem: Model<MenuItemDoc> =
  (mongoose.models.MenuItem as Model<MenuItemDoc>) ||
  mongoose.model<MenuItemDoc>("MenuItem", MenuItemSchema);

// Defaults used to seed the menu collection the first time it is read.
export const DEFAULT_FOOD_ITEMS = [
  { name: "Tomato Soup", price: 120, category: "Soups" },
  { name: "Sweet Corn Soup", price: 130, category: "Soups" },
  { name: "Manchow Soup", price: 140, category: "Soups" },
  { name: "Hot & Sour Soup", price: 130, category: "Soups" },
  { name: "Paneer Tikka", price: 220, category: "Starters" },
  { name: "Chicken 65", price: 250, category: "Starters" },
  { name: "Gobi Manchurian", price: 180, category: "Starters" },
  { name: "Fish Fry", price: 280, category: "Starters" },
  { name: "Prawns Fry", price: 320, category: "Starters" },
  { name: "Chicken Dum Biriyani", price: 280, category: "Biriyani" },
  { name: "Mutton Biriyani", price: 350, category: "Biriyani" },
  { name: "Prawns Biriyani", price: 380, category: "Biriyani" },
  { name: "Veg Biriyani", price: 200, category: "Biriyani" },
  { name: "Egg Biriyani", price: 220, category: "Biriyani" },
  { name: "Mango Lassi", price: 100, category: "Cocktails" },
  { name: "Blue Lagoon", price: 150, category: "Cocktails" },
  { name: "Mojito", price: 140, category: "Cocktails" },
  { name: "Watermelon Cooler", price: 120, category: "Cocktails" },
].map((i) => ({ ...i, kind: "FOOD" as const }));

export const DEFAULT_TEA_SNACKS_ITEMS = [
  { name: "Special Tea", price: 30, category: "Tea" },
  { name: "Ginger Tea", price: 35, category: "Tea" },
  { name: "Lemon Tea", price: 35, category: "Tea" },
  { name: "Coffee", price: 40, category: "Tea" },
  { name: "Milk", price: 25, category: "Tea" },
  { name: "Samosa", price: 20, category: "Veg Snacks" },
  { name: "Corn Samosa", price: 25, category: "Veg Snacks" },
  { name: "Veg Rolls", price: 40, category: "Veg Snacks" },
  { name: "French Fries", price: 80, category: "Veg Snacks" },
  { name: "Chicken Popcorn", price: 120, category: "Non-Veg Snacks" },
  { name: "Chicken Nuggets", price: 130, category: "Non-Veg Snacks" },
  { name: "Chicken Rolls", price: 100, category: "Non-Veg Snacks" },
].map((i) => ({ ...i, kind: "TEA_SNACKS" as const }));
