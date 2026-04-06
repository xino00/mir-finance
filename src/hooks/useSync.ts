import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { pushToSupabase, pullFromSupabase } from '../lib/sync';
import type { AppState } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'ok';

// Re-pull if user returns to the tab after being away for this long
const VISIBILITY_REPULL_MS = 5 * 60 * 1000; // 5 minutes

export function useSync() {
  const { user } = useAuth();
  const ctx = useAppContext();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPulled = useRef(false);
  const isPulling = useRef(false);
  const lastPulledAt = useRef<number | null>(null);

  function applyState(state: AppState) {
    ctx.dispatchTransactions({ type: 'SET_TRANSACTIONS', payload: state.transactions ?? [] });
    ctx.dispatchGuardShifts({ type: 'SET_GUARD_SHIFTS', payload: state.guardShifts ?? [] });
    ctx.dispatchInvestmentFunds({ type: 'SET_FUNDS', payload: state.investmentFunds ?? [] });
    ctx.dispatchInvestmentEntries({ type: 'SET_ENTRIES', payload: state.investmentEntries ?? [] });
    ctx.dispatchCreditCard({ type: 'SET_CC_ENTRIES', payload: state.creditCardEntries ?? [] });
    ctx.dispatchBudgets({ type: 'SET_BUDGETS', payload: state.monthlyBudgets ?? [] });
    if (state.monthlyPayslips) ctx.dispatchPayslips({ type: 'SET_PAYSLIPS', payload: state.monthlyPayslips });
    if (state.settings) ctx.dispatchSettings({ type: 'SET_SETTINGS', payload: state.settings });
  }

  async function doPull(userId: string) {
    if (isPulling.current) return;
    isPulling.current = true;
    // Cancel any pending push while pull is in flight to avoid overwriting remote data
    if (pushTimeoutRef.current) {
      clearTimeout(pushTimeoutRef.current);
      pushTimeoutRef.current = null;
    }
    setStatus('syncing');
    setSyncError(null);
    try {
      const state = await pullFromSupabase(userId);
      if (state) applyState(state);
      setStatus('ok');
      setLastSync(new Date());
      lastPulledAt.current = Date.now();
    } catch (err) {
      setStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Error de sincronización');
    } finally {
      isPulling.current = false;
    }
  }

  // Pull on login (once per session)
  useEffect(() => {
    if (!user || hasPulled.current) return;
    hasPulled.current = true;
    doPull(user.id);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset flags on logout
  useEffect(() => {
    if (!user) {
      hasPulled.current = false;
      isPulling.current = false;
      lastPulledAt.current = null;
    }
  }, [user]);

  // Re-pull when user returns to the tab after 5+ minutes away
  useEffect(() => {
    if (!user) return;
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      const last = lastPulledAt.current;
      if (last === null || now - last >= VISIBILITY_REPULL_MS) {
        doPull(user!.id);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-push debounced whenever state changes (skip if pull is in progress)
  useEffect(() => {
    if (!user) return;
    if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
    pushTimeoutRef.current = setTimeout(() => {
      if (isPulling.current) return; // pull will trigger a push via state change afterwards
      const state: AppState = {
        transactions: ctx.transactions,
        guardShifts: ctx.guardShifts,
        investmentFunds: ctx.investmentFunds,
        investmentEntries: ctx.investmentEntries,
        creditCardEntries: ctx.creditCardEntries,
        monthlyBudgets: ctx.monthlyBudgets,
        monthlyPayslips: ctx.monthlyPayslips,
        settings: ctx.settings,
        version: 1,
      };
      setStatus('syncing');
      setSyncError(null);
      pushToSupabase(user.id, state)
        .then(() => { setStatus('ok'); setLastSync(new Date()); })
        .catch((err: unknown) => {
          setStatus('error');
          setSyncError(err instanceof Error ? err.message : 'Error de sincronización');
        });
    }, 2000);

    return () => {
      if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current);
    };
  }, [
    user,
    ctx.transactions,
    ctx.guardShifts,
    ctx.investmentFunds,
    ctx.investmentEntries,
    ctx.creditCardEntries,
    ctx.monthlyBudgets,
    ctx.monthlyPayslips,
    ctx.settings,
  ]);

  async function manualSync() {
    if (!user) return;
    setStatus('syncing');
    setSyncError(null);
    try {
      await pushToSupabase(user.id, {
        transactions: ctx.transactions,
        guardShifts: ctx.guardShifts,
        investmentFunds: ctx.investmentFunds,
        investmentEntries: ctx.investmentEntries,
        creditCardEntries: ctx.creditCardEntries,
        monthlyBudgets: ctx.monthlyBudgets,
        monthlyPayslips: ctx.monthlyPayslips,
        settings: ctx.settings,
        version: 1,
      });
      setStatus('ok');
      setLastSync(new Date());
    } catch (err) {
      setStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Error de sincronización');
    }
  }

  return { status, syncError, lastSync, manualSync };
}
