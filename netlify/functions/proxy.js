exports.handler = async (event) => {
  try {
    const target = event.queryStringParameters?.url;

    if (!target) {
      return {
        statusCode: 400,
        body: "Missing url parameter"
      };
    }

    const fullUrl = decodeURIComponent(target);

    const response = await fetch(fullUrl);
    const contentType = response.headers.get("content-type") || "";

    /* =====================================================
       🔥 IF MPD → Rewrite all segment URLs to proxy
    ====================================================== */
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {

      let xml = await response.text();

      // Base path of original MPD
      const basePath = fullUrl.substring(0, fullUrl.lastIndexOf("/") + 1);

      // Helper to build proxified URL
      const makeProxyUrl = (relativePath) => {
        const absolute = basePath + relativePath;

        return (
          event.headers["x-forwarded-proto"] +
          "://" +
          event.headers.host +
          "/proxy?url=" +
          encodeURIComponent(absolute)
        );
      };

      // Remove ALL existing BaseURL tags (important)
      xml = xml.replace(/<BaseURL>.*?<\/BaseURL>/g, "");

      // Rewrite media=
      xml = xml.replace(/media="([^"]+)"/g, (match, p1) => {
        return `media="${makeProxyUrl(p1)}"`;
      });

      // Rewrite initialization=
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

    /* =====================================================
       🔥 SEGMENTS (Binary)
    ====================================================== */

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
    console.error("Proxy error:", err);
    return {
      statusCode: 500,
      body: "Proxy error"
    };
  }
};
