export declare type RecRTCTrackKind = "audio" | "video";
export declare type RecRTCDirection = "sendonly" | "recvonly" | "sendrecv";
export declare type RecCodecParameters = {
    kind: RecRTCTrackKind;
    mediaLevelIP?: string;
    rtpPort: number;
    codecId: number;
    direction?: RecRTCDirection;
    rtpProfile: string;
    codec: string;
    codecRate: number | string;
    fmtpOpts?: string;
};
export declare type SDPParameters = {
    topLevelIP: string;
    codecParameters: Array<RecCodecParameters>;
};
declare const generateSDP: (parameters: SDPParameters) => string;
export { generateSDP, };
//# sourceMappingURL=sdp-utils.d.ts.map