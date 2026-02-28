exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS"
        }
      };
    }

    let fullUrl = event.path.replace(/^\/proxy\//, "");

    if (event.rawQuery) {
      fullUrl += "?" + event.rawQuery;
    }

    fullUrl = decodeURIComponent(fullUrl);

    if (!fullUrl.startsWith("http")) {
      fullUrl = "http://" + fullUrl;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": event.headers["user-agent"] || "Mozilla/5.0",
        "Referer": fullUrl,
        "Accept": "*/*",
        "Range": event.headers["range"] || "",
        "Origin": event.headers["origin"] || ""
      }
    });

    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/octet-stream",
        "Content-Length": buffer.byteLength,
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: "Proxy error"
    };
  }
};
