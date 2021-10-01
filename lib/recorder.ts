"use strict";

import EventEmitter from "events";
import fs from "fs";
import path from "path";
import Ffmpeg, {FfmpegCommand} from "fluent-ffmpeg";
import { generateSDP, SDPParameters } from "./sdp-utils";

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

  sdp: string;

  private _getOutputDirname(outputFile: string): string {
    return path.dirname(outputFile);
  }

  private _getSdpPath(outputFile: string): string {
    return `${outputFile}.sdp`;
  }

  private _handleStart(commandLine: string) {
    this.emit('started', commandLine);
  }

  private _handleProgress(progress: any) {
    this.emit('progress', progress);
  }

  private _handleError(error: Error, stdout: any, stderr: any) {
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
    fs.mkdir(this._getOutputDirname(this._config.outputFile),
      { recursive: true}, (error) => {
        if (error) throw error;

        fs.writeFile(sdpPath, this.sdp, (error) => {
          if (error) throw error;

          const ffmpegParameters = this._config.ffmpegParameters;

          try {
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

            this._command = this._command.outputOptions(ffmpegParameters.outputOptions || [])
              .on('start', this._handleStart.bind(this))
              .on('progress', this._handleProgress.bind(this))
              .on('error', this._handleError.bind(this))
              .on('end', this._handleEnd.bind(this))
              .save(this._config.outputFile)
          } catch (error) {
            throw error;
          }
        });
      });
  }

  stop () {
    this._command?.kill('SIGSTOP');
  }
}
