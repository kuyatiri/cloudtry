exports.handler = async (event) => {
  try {
    // Remove function prefix
    const prefix = "/.netlify/functions/proxy/";
    let encodedUrl = event.path.startsWith(prefix)
      ? event.path.slice(prefix.length)
      : "";

    if (!encodedUrl) {
      return { statusCode: 400, body: "Missing target URL" };
    }

    // Decode full target
    const fullUrl = decodeURIComponent(encodedUrl);

    console.log("Fetching:", fullUrl);

    const response = await fetch(fullUrl);

    const contentType = response.headers.get("content-type") || "";

    // MPD (text)
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {
      const text = await response.text();
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/dash+xml",
          "Access-Control-Allow-Origin": "*"
        },
        body: text
      };
    }

    // Binary segments
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
