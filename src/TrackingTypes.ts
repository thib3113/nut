export interface TrackingOptions {
    followTracking?: boolean;
    trackingTimeout?: number;
    trackingPollInterval?: number;
}

export type CommandResult = { tracked: true; trackingUid: string } | { tracked: false; success: true };

/**
 * Result of a tracked command with followTracking enabled.
 *
 * Note: `success: true` is always present when `tracked: false` because
 * errors throw exceptions rather than returning a result object.
 */
export type TrackedResult = { tracked: true; status: 'SUCCESS' | 'ERR' } | { tracked: false; success: true };
