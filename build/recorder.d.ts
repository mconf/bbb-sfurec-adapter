/// <reference types="node" />
import EventEmitter from "events";
import { SDPParameters } from "./sdp-utils";
export declare type FfmpegParameters = {
    codec: string;
    inputOptions?: Array<string>;
    outputOptions?: Array<string>;
};
export declare type RecorderConfig = {
    outputFile: string;
    sdpParameters: SDPParameters;
    ffmpegParameters: FfmpegParameters;
};
export declare class FFmpegRecorder extends EventEmitter {
    private readonly _config;
    private _command?;
    sdp: string;
    private _getSdpPath;
    private _handleStart;
    private _handleProgress;
    private _handleError;
    private _handleEnd;
    constructor(recorderConfig: RecorderConfig);
    start(): void;
    stop(): void;
}
//# sourceMappingURL=recorder.d.ts.map