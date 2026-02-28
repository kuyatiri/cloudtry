exports.handler = async (event) => {
  try {
    // Get everything after /proxy/
    const splat = event.path.replace(
      "/.netlify/functions/proxy/",
      ""
    );

    if (!splat) {
      return { statusCode: 400, body: "Missing target" };
    }

    // Decode
    const fullUrl = decodeURIComponent(splat);

    const response = await fetch(fullUrl);

    const contentType = response.headers.get("content-type") || "";

    // MPD
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
    console.error(err);
    return { statusCode: 500, body: "Proxy error" };
  }
};
