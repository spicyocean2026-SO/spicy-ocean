"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

interface TableCardProps {
  tableNumber: number;
  hasOrder: boolean;
  itemCount: number;
  onClick: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ tableNumber, hasOrder, itemCount, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl p-5 border-2 transition-colors ${
        hasOrder
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card hover:border-primary/20'
      } shadow-sm`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          hasOrder ? 'gradient-primary' : 'bg-muted'
        }`}>
          <UtensilsCrossed className={`w-5 h-5 ${hasOrder ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        </div>
        <h3 className="font-semibold text-foreground">Table {tableNumber}</h3>
        {hasOrder && (
          <span className="text-xs font-medium text-primary">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
        )}
        {!hasOrder && (
          <span className="text-xs text-muted-foreground">Available</span>
        )}
      </div>
      {hasOrder && (
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary animate-pulse-soft" />
      )}
    </motion.div>
  );
};

export default TableCard;
