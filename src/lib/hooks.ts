/**
 * Print Shop OS - Data Hooks
 *
 * React hooks that connect UI components to data (dev data or real API)
 *
 * Usage:
 *   import { useOrders, useCustomers, useDashboardStats, useProductionStats } from '@/lib/hooks'
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchOrders,
  fetchCustomers,
  fetchDashboardStats,
  fetchOrderById,
  fetchCustomerById,
  fetchOrderPayments,
  type Order,
  type Customer,
  type Payment
} from './api-adapter'

// =============================================================================
// Types
// =============================================================================

export interface ProductionStats {
  quote: number
  art: number
  screenprint: number
  embroidery: number
  dtg: number
  fulfillment: number
  complete: number
  total: number
}

// =============================================================================
// Constants
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mintprints-api.ronny.works'

// =============================================================================
// useProductionStats - Fetch production stats from API
// =============================================================================

export function useProductionStats() {
  const [stats, setStats] = useState<ProductionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/production-stats`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      // API returns strings, convert to numbers
      setStats({
        quote: parseInt(data.quote, 10) || 0,
        art: parseInt(data.art, 10) || 0,
        screenprint: parseInt(data.screenprint, 10) || 0,
        embroidery: parseInt(data.embroidery, 10) || 0,
        dtg: parseInt(data.dtg, 10) || 0,
        fulfillment: parseInt(data.fulfillment, 10) || 0,
        complete: parseInt(data.complete, 10) || 0,
        total: parseInt(data.total, 10) || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch production stats'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}

// =============================================================================
// useOrders - Fetch and manage orders list
// =============================================================================

export function useOrders(options?: { limit?: number; status?: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrders(options)
      setOrders(result.orders)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.status])

  useEffect(() => {
    load()
  }, [load])

  return { orders, total, loading, error, refetch: load }
}

// =============================================================================
// useCustomers - Fetch and manage customers list
// =============================================================================

export function useCustomers(options?: { limit?: number; search?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomers(options)
      setCustomers(result.customers)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customers'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.search])

  useEffect(() => {
    load()
  }, [load])

  return { customers, total, loading, error, refetch: load }
}

// =============================================================================
// useDashboardStats - Fetch dashboard statistics
// =============================================================================

export function useDashboardStats() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    customerCount: 0,
    needsAttention: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboardStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}

// =============================================================================
// useOrder - Fetch single order by ID
// =============================================================================

export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setOrder(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrderById(id)
      setOrder(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch order'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { order, loading, error, refetch: load }
}

// =============================================================================
// useCustomer - Fetch single customer by ID
// =============================================================================

export function useCustomer(id: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setCustomer(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomerById(id)
      setCustomer(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customer'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { customer, loading, error, refetch: load }
}

// =============================================================================
// useOrderPayments - Fetch payments for a specific order
// =============================================================================

export function useOrderPayments(orderId: string | null) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!orderId) {
      setPayments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrderPayments(orderId)
      setPayments(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payments'))
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  return { payments, loading, error, refetch: load }
}
