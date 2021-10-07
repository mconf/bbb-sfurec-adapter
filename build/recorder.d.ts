/// <reference types="node" />
import EventEmitter from "events";
import { SDPParameters } from "./sdp-utils";
declare const RecorderStates: {
    readonly Stopped: "stopped";
    readonly Starting: "starting";
    readonly Started: "started";
    readonly Running: "running";
    readonly Stopping: "stopping";
    readonly Failed: "failed";
};
export declare type RecorderState = typeof RecorderStates[keyof typeof RecorderStates];
export declare type FfmpegCodecTypes = {
    audio?: string;
    video?: string;
};
export declare type FfmpegParameters = {
    codecs: FfmpegCodecTypes;
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
    private _getOutputDirname;
    private _getSdpPath;
    private _handleStart;
    private _handleProgress;
    private _handleError;
    private _handleEnd;
    private _state;
    get state(): RecorderState;
    set state(newState: RecorderState);
    private _runCommand;
    sdp: string;
    constructor(recorderConfig: RecorderConfig);
    start(): Promise<RecorderState>;
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=recorder.d.ts.map