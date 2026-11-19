/**
 * Pure deterministic Rate Limiter & Adaptive Threat Engine.
 * Complexity: Time O(1) per request/tick, Space O(1) per client key.
 * Considered Sliding Window Log (rejected: O(N) memory per client key under burst).
 * Implements: Token Bucket, Fixed Window (demonstrating 2x boundary spike), GCRA,
 * plus adaptive threat scoring mapped from cybersec-playbooks
 * (`implementing-api-abuse-detection-with-rate-limiting`).
 */

export const ALGORITHMS = Object.freeze({
  TOKEN_BUCKET: "token-bucket",
  FIXED_WINDOW: "fixed-window",
  GCRA: "gcra",
});

export const THREAT_LEVELS = Object.freeze({
  NORMAL: { id: "NORMAL", label: "Normal", rateScale: 1.0, burstScale: 1.0, blockSec: 0 },
  ELEVATED: { id: "ELEVATED", label: "Elevated", rateScale: 0.65, burstScale: 0.8, blockSec: 0 },
  HIGH: { id: "HIGH", label: "High", rateScale: 0.35, burstScale: 0.5, blockSec: 4 },
  CRITICAL: { id: "CRITICAL", label: "Critical (Blocked)", rateScale: 0.15, burstScale: 0.3, blockSec: 8 },
});

export function createInitialState(config = {}) {
  const capacity = config.capacity ?? 10;
  const refillRate = config.refillRate ?? 2.0; // tokens/sec
  return {
    algorithm: config.algorithm ?? ALGORITHMS.TOKEN_BUCKET,
    capacity,
    refillRate,
    windowSec: config.windowSec ?? 5.0,
    nowSec: 0,
    // Token bucket state
    tokens: capacity,
    // Fixed window state
    windowIndex: 0,
    windowCount: 0,
    // GCRA state (Theoretical Arrival Time)
    tatSec: 0,
    // Counters & telemetry
    totalRequests: 0,
    allowedCount: 0,
    rejectedCount: 0,
    consecutiveRejects: 0,
    recentWindowReq: 0,
    recentAuthFails: 0,
    recentUniquePaths: 1,
    securityXRay: false,
    threatLevel: THREAT_LEVELS.NORMAL,
    blockedUntilSec: 0,
    lastStatus: 200,
    lastRetryAfter: 0,
    lastBoundarySpike: false,
  };
}

/**
 * Computes adaptive threat level per cybersec-playbooks
 * `implementing-api-abuse-detection-with-rate-limiting`.
 */
export function assessThreatLevel(state, attackActive = false) {
  if (!state.securityXRay) return THREAT_LEVELS.NORMAL;
  let score = 0;
  const errRate = state.totalRequests > 0 ? state.rejectedCount / state.totalRequests : 0;
  if (state.recentAuthFails > 10 || attackActive) score += 3;
  else if (state.recentAuthFails > 4) score += 2;
  if (errRate > 0.65) score += 3;
  else if (errRate > 0.35) score += 2;
  if (state.recentWindowReq > 20) score += 2;
  else if (state.recentWindowReq > 10) score += 1;
  if (state.recentUniquePaths > 12) score += 2;

  if (score >= 7) return THREAT_LEVELS.CRITICAL;
  if (score >= 5) return THREAT_LEVELS.HIGH;
  if (score >= 3) return THREAT_LEVELS.ELEVATED;
  return THREAT_LEVELS.NORMAL;
}

export function effectiveParams(state) {
  const lvl = state.threatLevel;
  const cap = Math.max(2, Math.round(state.capacity * lvl.burstScale));
  const rate = Math.max(0.25, Number((state.refillRate * lvl.rateScale).toFixed(2)));
  return { cap, rate };
}

/**
 * Advance continuous clock by dtSec (clamped for tab-switch safety).
 */
export function advanceClock(state, dtSec, attackActive = false) {
  const dt = Math.max(0, Number.isFinite(dtSec) ? dtSec : 0);
  state.nowSec += dt;
  const { cap, rate } = effectiveParams(state);

  // Refill token bucket smoothly
  state.tokens = Math.min(cap, state.tokens + dt * rate);

  // Advance fixed window if boundary crossed
  const idx = Math.floor(state.nowSec / state.windowSec);
  if (idx !== state.windowIndex) {
    state.windowIndex = idx;
    state.windowCount = 0;
  }

  // Decay sliding telemetry gauges gently
  const decay = Math.exp(-dt / 4.0);
  state.recentWindowReq *= decay;
  if (!attackActive) {
    state.recentAuthFails = Math.max(0, state.recentAuthFails * Math.exp(-dt / 3.0));
    state.recentUniquePaths = Math.max(1, 1 + (state.recentUniquePaths - 1) * Math.exp(-dt / 4.0));
  }
  state.threatLevel = assessThreatLevel(state, attackActive);
  return state;
}

/**
 * Process one incoming API request deterministically in O(1).
 * Returns standard RFC / industry rate-limit headers & decision.
 */
export function evaluateRequest(state, { cost = 1, isAuthFailure = false, endpoint = "/v1/orders", attackActive = false } = {}) {
  state.totalRequests += 1;
  state.recentWindowReq += 1;
  if (isAuthFailure) state.recentAuthFails += 1;
  if (attackActive) state.recentUniquePaths = Math.min(64, state.recentUniquePaths + 1.5);
  state.threatLevel = assessThreatLevel(state, attackActive);

  const { cap, rate } = effectiveParams(state);

  // Hard temporary block when Adaptive Security X-Ray hits CRITICAL
  if (state.securityXRay && state.nowSec < state.blockedUntilSec) {
    const retryAfter = Math.max(1, Math.ceil(state.blockedUntilSec - state.nowSec));
    state.rejectedCount += 1;
    state.consecutiveRejects += 1;
    state.lastStatus = 429;
    state.lastRetryAfter = retryAfter;
    return {
      allowed: false,
      status: 429,
      reason: "adaptive_threat_block",
      headers: {
        "X-RateLimit-Limit": String(cap),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(state.blockedUntilSec)),
        "Retry-After": String(retryAfter),
        "X-Threat-Level": state.threatLevel.id,
      },
    };
  }

  let allowed = false;
  let remaining = 0;
  let retryAfter = 0;
  let resetInSec = 0;
  let boundarySpike = false;

  if (state.algorithm === ALGORITHMS.TOKEN_BUCKET) {
    if (state.tokens >= cost) {
      state.tokens -= cost;
      allowed = true;
      remaining = Math.floor(state.tokens);
      resetInSec = (cap - state.tokens) / rate;
    } else {
      allowed = false;
      remaining = 0;
      retryAfter = Math.max(1, Math.ceil((cost - state.tokens) / rate));
      resetInSec = retryAfter;
    }
  } else if (state.algorithm === ALGORITHMS.FIXED_WINDOW) {
    const idx = Math.floor(state.nowSec / state.windowSec);
    if (idx !== state.windowIndex) {
      state.windowIndex = idx;
      state.windowCount = 0;
    }
    const elapsedInWindow = state.nowSec - state.windowIndex * state.windowSec;
    resetInSec = Math.max(0.1, state.windowSec - elapsedInWindow);
    if (state.windowCount + cost <= cap) {
      state.windowCount += cost;
      allowed = true;
      remaining = Math.max(0, cap - state.windowCount);
      state.tokens = remaining; // mirror for visual gauge
      // Flag the classic Fixed-Window 2x boundary spike hazard near window edges
      if (elapsedInWindow > state.windowSec * 0.78 || elapsedInWindow < state.windowSec * 0.22) {
        if (state.recentWindowReq > cap * 1.15) boundarySpike = true;
      }
    } else {
      allowed = false;
      remaining = 0;
      state.tokens = 0;
      retryAfter = Math.max(1, Math.ceil(resetInSec));
    }
  } else {
    // GCRA (Generic Cell Rate Algorithm) — O(1) single-timestamp sliding burst control
    const T = 1 / rate; // emission interval
    const tau = (cap - 1) * T; // burst tolerance
    const tat = Math.max(state.nowSec, state.tatSec);
    const allowAt = tat - tau;
    if (state.nowSec >= allowAt) {
      state.tatSec = tat + cost * T;
      allowed = true;
      const used = Math.max(0, (state.tatSec - state.nowSec) / T);
      remaining = Math.max(0, Math.floor(cap - used));
      state.tokens = Math.max(0, Math.min(cap, cap - used));
      resetInSec = Math.max(0, state.tatSec - state.nowSec);
    } else {
      allowed = false;
      remaining = 0;
      state.tokens = 0;
      retryAfter = Math.max(1, Math.ceil(allowAt - state.nowSec));
      resetInSec = retryAfter;
    }
  }

  state.lastBoundarySpike = boundarySpike;
  if (allowed) {
    state.allowedCount += 1;
    state.consecutiveRejects = 0;
    state.lastStatus = 200;
    state.lastRetryAfter = 0;
  } else {
    state.rejectedCount += 1;
    state.consecutiveRejects += 1;
    state.lastStatus = 429;
    state.lastRetryAfter = retryAfter;
    if (state.securityXRay && state.threatLevel.blockSec > 0 && state.consecutiveRejects >= 3) {
      state.blockedUntilSec = state.nowSec + state.threatLevel.blockSec;
    }
  }

  return {
    allowed,
    status: allowed ? 200 : 429,
    boundarySpike,
    reason: allowed ? "admitted" : "rate_limit_exceeded",
    headers: {
      "X-RateLimit-Limit": String(cap),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(state.nowSec + resetInSec)),
      ...(allowed ? {} : { "Retry-After": String(retryAfter) }),
      "X-Threat-Level": state.threatLevel.id,
    },
  };
}
