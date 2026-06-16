'use client'
import { useReducer, useEffect } from 'react'
import type { PackingProduct, CartItem } from '@/lib/packing-data'

type CartAction =
  | { type: 'ADD_ITEM';    product: PackingProduct; qty: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY';  id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD';        items: CartItem[] }

const CART_KEY = 'grandpro:packing:cart'

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'LOAD':
      return action.items
    case 'ADD_ITEM': {
      const existing = state.find(i => i.product.id === action.product.id)
      if (existing) {
        return state.map(i =>
          i.product.id === action.product.id
            ? { ...i, qty: i.qty + action.qty }
            : i
        )
      }
      return [...state, { product: action.product, qty: action.qty }]
    }
    case 'REMOVE_ITEM':
      return state.filter(i => i.product.id !== action.id)
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter(i => i.product.id !== action.id)
      return state.map(i =>
        i.product.id === action.id ? { ...i, qty: action.qty } : i
      )
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function useCart() {
  const [items, dispatch] = useReducer(cartReducer, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'LOAD', items: parsed })
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem = (product: PackingProduct, qty = 1) =>
    dispatch({ type: 'ADD_ITEM', product, qty })
  const removeItem = (id: string) =>
    dispatch({ type: 'REMOVE_ITEM', id })
  const updateQty = (id: string, qty: number) =>
    dispatch({ type: 'UPDATE_QTY', id, qty })
  const clearCart = () =>
    dispatch({ type: 'CLEAR' })

  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return { items, addItem, removeItem, updateQty, clearCart, total, count }
}
