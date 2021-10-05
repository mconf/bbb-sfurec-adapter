"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmpegRecorder = void 0;
const events_1 = __importDefault(require("events"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const sdp_utils_1 = require("./sdp-utils");
class FFmpegRecorder extends events_1.default {
    constructor(recorderConfig) {
        super();
        this._config = recorderConfig;
        this.sdp = sdp_utils_1.generateSDP(recorderConfig.sdpParameters);
    }
    _getOutputDirname(outputFile) {
        return path_1.default.dirname(outputFile);
    }
    _getSdpPath(outputFile) {
        return `${outputFile}.sdp`;
    }
    _handleStart(commandLine) {
        this.emit('started', commandLine);
    }
    _handleProgress(progress) {
        this.emit('progress', progress);
    }
    _handleError(error, stdout, stderr) {
        this.emit('error', error);
    }
    _handleEnd() {
        this.emit('ended');
    }
    start() {
        // Create SDP file in the FS so that ffmpeg can grab it
        const sdpPath = this._getSdpPath(this._config.outputFile);
        fs_1.default.mkdir(this._getOutputDirname(this._config.outputFile), { recursive: true }, (error) => {
            if (error)
                throw error;
            fs_1.default.writeFile(sdpPath, this.sdp, (error) => {
                if (error)
                    throw error;
                const ffmpegParameters = this._config.ffmpegParameters;
                try {
                    this._command = fluent_ffmpeg_1.default({
                        source: sdpPath,
                        logger: console,
                    }).inputOptions(ffmpegParameters.inputOptions || []);
                    if (ffmpegParameters.codecs.video) {
                        this._command = this._command.videoCodec(ffmpegParameters.codecs.video);
                    }
                    if (ffmpegParameters.codecs.audio) {
                        this._command = this._command.audioCodec(ffmpegParameters.codecs.audio);
                    }
                    this._command = this._command.outputOptions(ffmpegParameters.outputOptions || [])
                        .on('start', this._handleStart.bind(this))
                        .on('progress', this._handleProgress.bind(this))
                        .on('error', this._handleError.bind(this))
                        .on('end', this._handleEnd.bind(this))
                        .save(this._config.outputFile);
                }
                catch (error) {
                    throw error;
                }
            });
        });
    }
    stop() {
        var _a;
        (_a = this._command) === null || _a === void 0 ? void 0 : _a.kill('SIGTERM');
    }
}
exports.FFmpegRecorder = FFmpegRecorder;
