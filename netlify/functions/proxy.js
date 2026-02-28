exports.handler = async (event) => {
  try {

    const prefix = "/proxy/";
    let encodedUrl = event.path.startsWith(prefix)
      ? event.path.slice(prefix.length)
      : "";

    if (!encodedUrl) {
      return { statusCode: 400, body: "Missing target URL" };
    }

    const fullUrl = decodeURIComponent(encodedUrl);
    const response = await fetch(fullUrl);
    const contentType = response.headers.get("content-type") || "";

    // If MPD → rewrite segment URLs
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {

      let xml = await response.text();

      const basePath = fullUrl.substring(0, fullUrl.lastIndexOf("/") + 1);

      const makeProxyUrl = (relative) => {
        const absolute = basePath + relative;
        return "/proxy/" + encodeURIComponent(absolute);
      };

      // Rewrite media=
      xml = xml.replace(/media="([^"]+)"/g, (m, p1) => {
        return `media="${makeProxyUrl(p1)}"`;
      });

      // Rewrite initialization=
      xml = xml.replace(/initialization="([^"]+)"/g, (m, p1) => {
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

    // Binary segment
    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Access-Control-Allow-Origin": "*"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Proxy error"
    };
  }
};
