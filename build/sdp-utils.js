"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSDP = void 0;
const generateSDP = (parameters) => {
    console.log(parameters);
    const codecParameters = parameters.codecParameters;
    let body = '';
    const header = "v=0\r\n"
        + `o=- 0 0 IN IP4 ${parameters.topLevelIP} \r\n`
        + "s=sfurec-adapter\r\n";
    codecParameters.forEach(({ kind, mediaLevelIP, rtpPort, codecId, direction, rtpProfile, codec, codecRate, fmtpOpts, }) => {
        const rtcpPort = rtpPort + 1;
        console.log("rtcp port", rtcpPort);
        body = body
            + `m=${kind} ${rtpPort} ${rtpProfile} ${codecId}\r\n`
            + `a=rtcp:${rtcpPort}\r\n`
            + `a=${direction || 'sendrecv'}\r\n`
            + `c=IN IP4 ${mediaLevelIP || parameters.topLevelIP}\r\n`
            + `a=rtpmap:${codecId} ${codec}/${codecRate}\r\n`
            + `a=fmtp:${codecId} ${fmtpOpts || ''}\r\n`;
    });
    return header + body;
};
exports.generateSDP = generateSDP;
