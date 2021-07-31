"use strict";

import EventEmitter from "events";
import fs from "fs";
import Ffmpeg, {FfmpegCommand} from "fluent-ffmpeg";
import { generateSDP, SDPParameters } from "./sdp-utils";

export type FfmpegParameters = {
  codec: string;
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

  sdp: string;

  private _getSdpPath(outputFile: string): string {
    return `${outputFile}.sdp`;
  }

  private _handleStart(commandLine: string) {
    this.emit('started', commandLine);
  }

  private _handleProgress(progress: any) {
    this.emit('progress', progress);
  }

  private _handleError(error: Error) {
    this.emit('error', error);
  }

  private _handleEnd() {
    this.emit('ended');
  }

  constructor(recorderConfig: RecorderConfig) {
    super();
    this._config = recorderConfig;
    this.sdp = generateSDP(recorderConfig.sdpParameters);
  }

  start () {
    // Create SDP file in the FS so that ffmpeg can grab it
    const sdpPath: string = this._getSdpPath(this._config.outputFile);
    fs.writeFile(sdpPath, this.sdp, (error) => {
      if (error) throw error;

      this._command = Ffmpeg(sdpPath)
        .inputOptions(this._config.ffmpegParameters.inputOptions || [])
        .videoCodec(this._config.ffmpegParameters.codec)
        .outputOption(this._config.ffmpegParameters.outputOptions || [])
        .on('start', this._handleStart.bind(this))
        .on('progress', this._handleProgress.bind(this))
        .on('error', this._handleError.bind(this))
        .on('end', this._handleEnd.bind(this))
        .save(this._config.outputFile)
    });
  }

  stop () {
    this._command?.kill('SIGSTOP');
  }
}
