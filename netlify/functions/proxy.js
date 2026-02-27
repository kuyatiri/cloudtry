exports.handler = async (event) => {
  const rawPath = event.path.replace("/.netlify/functions/proxy/", "");
  const decodedPath = decodeURIComponent(rawPath);
  const targetUrl = "http://" + decodedPath;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: targetUrl
  };
};
