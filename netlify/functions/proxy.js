exports.handler = async (event) => {
  try {

    const target = event.queryStringParameters?.url;
    if (!target) {
      return { statusCode: 400, body: "Missing url" };
    }

    const fullUrl = decodeURIComponent(target);

    const response = await fetch(fullUrl);
    const contentType = response.headers.get("content-type") || "";

    // 🔥 If MPD → rewrite BaseURL
    if (contentType.includes("mpd") || fullUrl.endsWith(".mpd")) {

      let xml = await response.text();

      // Extract base path from original URL
      const urlObj = new URL(fullUrl);
      const basePath = fullUrl.substring(0, fullUrl.lastIndexOf("/") + 1);

      const proxyBase =
        event.headers["x-forwarded-proto"] +
        "://" +
        event.headers.host +
        "/proxy?url=" +
        encodeURIComponent(basePath);

      // Inject BaseURL after <MPD ...>
      xml = xml.replace(
        /(<MPD[^>]*>)/,
        `$1\n<BaseURL>${proxyBase}</BaseURL>\n`
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/dash+xml",
          "Access-Control-Allow-Origin": "*"
        },
        body: xml
      };
    }

    // 🔥 Segments (binary)
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
  } catch (err) {
    return {
      statusCode: 500,
      body: "Proxy error"
    };
  }
};
