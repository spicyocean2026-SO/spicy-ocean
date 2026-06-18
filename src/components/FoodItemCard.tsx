"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@/context/RestaurantContext';

interface FoodItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onAdd }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{item.name}</h4>
        <p className="text-sm text-muted-foreground">{item.category}</p>
        <p className="font-semibold text-primary mt-1">₹{item.price}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onAdd(item)}
        className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-md flex-shrink-0"
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
};

export default FoodItemCard;
