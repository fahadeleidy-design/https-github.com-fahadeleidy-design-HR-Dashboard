// src/config/aiConfig.ts

/**
 * The server-side proxy endpoint that will securely call the Gemini API.
 * IMPORTANT: For security, the Gemini API should not be called directly from the browser.
 * Set this to your deployed proxy URL.
 * Defaults to undefined to force local fallback until a proxy is configured.
 */
export const AI_PROXY_ENDPOINT: string | undefined = undefined;

/**
 * A master switch to completely disable all AI correction features, overriding the user's choice.
 * Set to true for debugging or to force local processing.
 */
export const DISABLE_AI_OVERRIDE: boolean = false;

/**
 * The default state for the "Use AI Correction" toggle in the UI.
 * This is ignored if DISABLE_AI_OVERRIDE is true or if AI_PROXY_ENDPOINT is not set.
 */
export const DEFAULT_USE_AI: boolean = true;

/**
 * Timeout in milliseconds for each attempt to call the AI proxy.
 */
export const AI_TIMEOUT_MS: number = 30000; // 30 seconds

/**
 * Number of retries to attempt if the AI proxy call fails with a retryable error.
 */
export const AI_RETRIES: number = 2;

/**
 * If the number of rows in the uploaded file exceeds this limit,
 * only a sample of this size will be sent to the AI to prevent overly large requests.
 * The AI's transformations on the sample may be applied to the full dataset if the proxy supports it.
 */
export const AI_SAMPLE_LIMIT: number = 300;
