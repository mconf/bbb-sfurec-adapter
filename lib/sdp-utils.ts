export type RecRTCTrackKind = "audio" | "video";
export type RecRTCDirection = "sendonly" | "recvonly" | "sendrecv";

export type RecCodecParameters = {
  kind: RecRTCTrackKind;
  mediaLevelIP?: string;
  rtpPort: number;
  codecId: number;
  direction?: RecRTCDirection;
  rtpProfile: string;
  codec: string;
  codecRate: number | string;
  fmtpOpts?: string;
}

export type SDPParameters = {
  topLevelIP: string;
  codecParameters: Array<RecCodecParameters>;
}

const generateSDP = (parameters: SDPParameters): string => {
  const codecParameters: Array<RecCodecParameters> = parameters.codecParameters;
  let body = '';
  const header = "v=0\r\n"
    + `o=- 0 0 IN IP4 ${parameters.topLevelIP} \r\n`
    + "s=sfurec-adapter\r\n";

  codecParameters.forEach(({
    kind, mediaLevelIP, rtpPort, codecId, direction, rtpProfile, codec,
    codecRate, fmtpOpts,
  }: RecCodecParameters) => {
    const rtcpPort= rtpPort + 1;
    body = body
      + `m=${kind} ${rtpPort} ${rtpProfile} ${codecId}\r\n`
      + `a=rtcp:${rtcpPort}\r\n`
      +  (direction ? `a=${direction}\r\n` : '')
      + `c=IN IP4 ${mediaLevelIP || parameters.topLevelIP}\r\n`
      + `a=rtpmap:${codecId} ${codec}/${codecRate}\r\n`
      + `a=fmtp:${codecId} ${fmtpOpts || ''}\r\n`
  });
  return header + body;
};

export {
  generateSDP,
}
