"use strict";

import EventEmitter from "events";
import fs from "fs";
import path from "path";
import Ffmpeg, {FfmpegCommand} from "fluent-ffmpeg";
import { generateSDP, SDPParameters } from "./sdp-utils";

const { mkdir, writeFile } = fs.promises;

const RecorderStates = {
  Stopped: 'stopped',
  Starting: 'starting',
  Started: 'started',
  Running: 'running',
  Stopping: 'stopping',
  Failed: 'failed',
} as const;

export type RecorderState = typeof RecorderStates[keyof typeof RecorderStates];

export type FfmpegCodecTypes = {
  audio?: string;
  video?: string;
}
export type FfmpegParameters = {
  codecs: FfmpegCodecTypes;
  inputOptions?: Array<string>;
  outputOptions?: Array<string>;
}

export type RecorderConfig = {
  outputFile: string;
  sdpParameters: SDPParameters;
  ffmpegParameters: FfmpegParameters;
}

export class FFmpegRecorder extends EventEmitter {
  private readonly _config: RecorderConfig;

  private _command?: FfmpegCommand;

  private _getOutputDirname (outputFile: string): string {
    return path.dirname(outputFile);
  }

  private _getSdpPath (outputFile: string): string {
    return `${outputFile}.sdp`;
  }

  private _handleStart (commandLine: string) {
    this.state = RecorderStates.Started;
    this.emit('started', commandLine);
  }

  private _handleProgress (progress: any) {
    if (this.state === RecorderStates.Starting) {
      this.state = RecorderStates.Running;
    }
    this.emit('progress', progress);
  }

  private _handleError (error: Error, stdout: any, stderr: any) {
    if (this.state === RecorderStates.Stopped || this.state === RecorderStates.Failed) {
      return;
    } else if (this.state === RecorderStates.Stopping) {
      this._handleEnd(error.message)
    } else {
      this.emit('error', error);
      this.state = RecorderStates.Failed;
      this.stop();
      this._handleEnd(error.message);
    }
  }

  private _handleEnd (reason?: string) {
    this.emit('end', reason || 'normalexit');
    this.state = RecorderStates.Stopped;
  }

  private _state: RecorderState = RecorderStates.Stopped;

  public get state () : RecorderState {
    return this._state;
  }

  public set state (newState: RecorderState) {
    if (this.state !== newState) {
      this._state = newState;
      this.emit('stateChanged', this.state);
    }
  }

  private async _runCommand (
    command: FfmpegCommand, outputOptions: Array<string>
  ) : Promise<FfmpegCommand> {
    return new Promise<FfmpegCommand>((resolve, reject) => {
      const resolutionCallback = () => {
        command.removeListener('error', rejectionCallback);
        resolve(command);
      }
      const rejectionCallback = (error: Error) => {
        command.removeListener('start', resolutionCallback);
        reject(error);
      }

      command = command.outputOptions(outputOptions)
        .on('start', this._handleStart.bind(this))
        .on('progress', this._handleProgress.bind(this))
        .on('error', this._handleError.bind(this))
        .on('end', this._handleEnd.bind(this))
        .once('start', resolutionCallback)
        .once('error', rejectionCallback)
        .save(this._config.outputFile)
    });
  }

  public sdp: string;

  constructor(recorderConfig: RecorderConfig) {
    super();
    this._config = recorderConfig;
    this.sdp = generateSDP(recorderConfig.sdpParameters);
  }

  async start () : Promise<RecorderState> {
    try {
      this.state = RecorderStates.Starting;
      // Create SDP file in the FS so that ffmpeg can grab it
      const sdpPath: string = this._getSdpPath(this._config.outputFile);
      const ffmpegParameters = this._config.ffmpegParameters;
      const outputOptions : Array<string> = ffmpegParameters.outputOptions || [];

      await mkdir(this._getOutputDirname(this._config.outputFile), {
        recursive: true
      });
      await writeFile(sdpPath, this.sdp);

      this._command = Ffmpeg({
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
    } catch (error) {
      // TODO rollback
      throw error;
    }
  }

  stop () : Promise<void> {
    return new Promise<void>((resolve) => {
      if (this._command
        && this.state !== RecorderStates.Stopping
        && this.state !== RecorderStates.Stopped) {
        this.state = RecorderStates.Stopping;
        this.once('end', resolve);
        this._command.kill('SIGTERM');
      } else return resolve();
    });
  }
}
