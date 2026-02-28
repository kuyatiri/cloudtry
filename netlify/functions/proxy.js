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

    // 🔥 If MPD (text)
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {

      const text = await response.text();

      return {
        statusCode: response.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*"
        },
        body: text
      };
    }

    // 🔥 If segment (binary)
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
