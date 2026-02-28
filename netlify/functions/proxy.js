exports.handler = async (event) => {
  try {
    const target = event.queryStringParameters?.url;
    if (!target) {
      return { statusCode: 400, body: "Missing url parameter" };
    }

    const fullUrl = decodeURIComponent(target);

    console.log("Fetching:", fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": event.headers["user-agent"] || "",
        "Accept": "*/*",
        "Referer": fullUrl,
        "Connection": "keep-alive"
      }
    });

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // 🔥 If MPD → rewrite segments
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {

      let xml = await response.text();

      const basePath = fullUrl.substring(0, fullUrl.lastIndexOf("/") + 1);

      const makeProxyUrl = (relative) => {
        const absolute = basePath + relative;
        return "/proxy?url=" + encodeURIComponent(absolute);
      };

      // Rewrite media
      xml = xml.replace(/media="([^"]+)"/g, (match, p1) => {
        return `media="${makeProxyUrl(p1)}"`;
      });

      // Rewrite initialization
      xml = xml.replace(/initialization="([^"]+)"/g, (match, p1) => {
        return `initialization="${makeProxyUrl(p1)}"`;
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/dash+xml",
          "Access-Control-Allow-Origin": "*"
        },
        body: xml
      };
    }

    // 🔥 Binary segments (.m4s / .mp4)
    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Proxy error:", err);
    return {
      statusCode: 500,
      body: "Proxy error: " + err.message
    };
  }
};
