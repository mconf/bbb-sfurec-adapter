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
const { mkdir, writeFile } = fs_1.default.promises;
const RecorderStates = {
    Stopped: 'stopped',
    Starting: 'starting',
    Started: 'started',
    Running: 'running',
    Stopping: 'stopping',
    Failed: 'failed',
};
class FFmpegRecorder extends events_1.default {
    constructor(recorderConfig) {
        super();
        this._state = RecorderStates.Stopped;
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
        this.state = RecorderStates.Started;
        this.emit('started', commandLine);
    }
    _handleProgress(progress) {
        if (this.state === RecorderStates.Starting) {
            this.state = RecorderStates.Running;
        }
        this.emit('progress', progress);
    }
    _handleError(error, stdout, stderr) {
        if (this.state === RecorderStates.Stopped || this.state === RecorderStates.Failed) {
            return;
        }
        else if (this.state === RecorderStates.Stopping) {
            this._handleEnd(error.message);
        }
        else {
            this.emit('error', error);
            this.state = RecorderStates.Failed;
            this.stop();
            this._handleEnd(error.message);
        }
    }
    _handleEnd(reason) {
        this.emit('end', reason || 'normalexit');
        this.state = RecorderStates.Stopped;
    }
    get state() {
        return this._state;
    }
    set state(newState) {
        if (this.state !== newState) {
            this._state = newState;
            this.emit('stateChanged', this.state);
        }
    }
    async _runCommand(command, outputOptions) {
        return new Promise((resolve, reject) => {
            const resolutionCallback = () => {
                command.removeListener('error', rejectionCallback);
                resolve(command);
            };
            const rejectionCallback = (error) => {
                command.removeListener('start', resolutionCallback);
                reject(error);
            };
            command = command.outputOptions(outputOptions)
                .on('start', this._handleStart.bind(this))
                .on('progress', this._handleProgress.bind(this))
                .on('error', this._handleError.bind(this))
                .on('end', this._handleEnd.bind(this))
                .once('start', resolutionCallback)
                .once('error', rejectionCallback)
                .save(this._config.outputFile);
        });
    }
    async start() {
        try {
            this.state = RecorderStates.Starting;
            // Create SDP file in the FS so that ffmpeg can grab it
            const sdpPath = this._getSdpPath(this._config.outputFile);
            const ffmpegParameters = this._config.ffmpegParameters;
            const outputOptions = ffmpegParameters.outputOptions || [];
            await mkdir(this._getOutputDirname(this._config.outputFile), {
                recursive: true
            });
            await writeFile(sdpPath, this.sdp);
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
            this._command = await this._runCommand(this._command, outputOptions);
            return this.state;
        }
        catch (error) {
            // TODO rollback
            throw error;
        }
    }
    stop() {
        return new Promise((resolve) => {
            if (this._command
                && this.state !== RecorderStates.Stopping
                && this.state !== RecorderStates.Stopped) {
                this.state = RecorderStates.Stopping;
                this.once('end', resolve);
                this._command.kill('SIGTERM');
            }
            else
                return resolve();
        });
    }
}
exports.FFmpegRecorder = FFmpegRecorder;
