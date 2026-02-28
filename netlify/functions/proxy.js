exports.handler = async (event) => {
  try {

    let fullUrl = event.path.replace(/^\/proxy\//, "");

    if (event.rawQuery) {
      fullUrl += "?" + event.rawQuery;
    }

    fullUrl = decodeURIComponent(fullUrl);

    if (!fullUrl.startsWith("http")) {
      fullUrl = "http://" + fullUrl;
    }

    const response = await fetch(fullUrl);

    const contentType = response.headers.get("content-type") || "";

    // 🔥 If MPD file → rewrite
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {

      let text = await response.text();

      const basePath = event.path.replace(/\/manifest\.mpd.*$/, "");

      // Rewrite initialization
      text = text.replace(
        /initialization="([^"]+)"/g,
        (match, p1) => `initialization="${basePath}/${p1}"`
      );

      // Rewrite media
      text = text.replace(
        /media="([^"]+)"/g,
        (match, p1) => `media="${basePath}/${p1}"`
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/dash+xml",
          "Access-Control-Allow-Origin": "*"
        },
        body: text
      };
    }

    // 🔥 Otherwise return binary (segments)
    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type":
          contentType || "application/octet-stream",
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
