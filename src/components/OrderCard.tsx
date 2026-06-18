"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { OrderItem } from '@/context/RestaurantContext';

interface OrderCardProps {
  item: OrderItem;
  onStatusChange?: (itemId: string, status: OrderItem['status']) => void;
  showStatusButtons?: boolean;
}

const statusColors: Record<string, string> = {
  added: 'bg-highlight text-highlight-foreground',
  cooking: 'bg-primary text-primary-foreground',
  ready: 'bg-success text-success-foreground',
  completed: 'bg-muted text-muted-foreground',
};

const OrderCard: React.FC<OrderCardProps> = ({ item, onStatusChange, showStatusButtons }) => {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.menuItem.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">×{item.quantity}</span>
          <span className="text-sm font-medium text-primary">₹{item.menuItem.price * item.quantity}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={`${statusColors[item.status]} capitalize text-xs`}>
          {item.status}
        </Badge>
        {showStatusButtons && onStatusChange && item.status !== 'completed' && (
          <div className="flex gap-1">
            {item.status === 'added' && (
              <button
                onClick={() => onStatusChange(item.menuItem.id, 'cooking')}
                className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground font-medium"
              >
                Cook
              </button>
            )}
            {item.status === 'cooking' && (
              <button
                onClick={() => onStatusChange(item.menuItem.id, 'ready')}
                className="text-xs px-2 py-1 rounded-md bg-success text-success-foreground font-medium"
              >
                Ready
              </button>
            )}
            {item.status === 'ready' && (
              <button
                onClick={() => onStatusChange(item.menuItem.id, 'completed')}
                className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
