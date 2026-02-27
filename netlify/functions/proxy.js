exports.handler = async (event) => {
  const url = event.queryStringParameters.url;

  const response = await fetch(url);
  let text = await response.text();

  // Extract base directory from original URL
  const baseDir = url.substring(0, url.lastIndexOf("/") + 1);

  // Create proxy base
  const proxyBase =
    "https://tiriwifi.netlify.app/.netlify/functions/proxy?url=" +
    encodeURIComponent(baseDir);

  // Inject BaseURL after <Period>
  text = text.replace(
    "<Period",
    `<BaseURL>${proxyBase}</BaseURL>\n<Period`
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/dash+xml",
      "Access-Control-Allow-Origin": "*"
    },
    body: text
  };
};
