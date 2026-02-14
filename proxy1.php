<?php

function fetchFile($url) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_FRESH_CONNECT, true); // Ensure a fresh connection
curl_setopt($ch, CURLOPT_FORBID_REUSE, true);  // Do not reuse the connection

    $response = curl_exec($ch);

    if ($response === false) {
        error_log('Error fetching the file: ' . curl_error($ch));
        return [false, null];
    }

    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($httpCode !== 200) {
        error_log('HTTP error code: ' . $httpCode);
        return [false, null];
    }

    return [$response, $contentType];
}

function modifyPlaylist($content, $baseUrl) {
    return preg_replace('/(\/?[^\/\s]+?\.(?:ts|m3u8|mp4|aac|m4s|webvtt|vtt)[a-zA-Z0-9-_\.]*)/', 'proxy.php?file=' . urlencode($baseUrl) . '$1', $content);
}

function getBaseUrl($url) {
    $parsedUrl = parse_url($url);
    $scheme = isset($parsedUrl['scheme']) ? $parsedUrl['scheme'] . '://' : '';
    $host = isset($parsedUrl['host']) ? $parsedUrl['host'] : '';
    $path = isset($parsedUrl['path']) ? dirname($parsedUrl['path']) : '';
    
    return $scheme . $host . $path . '/';
}

if (isset($_GET['file'])) {
    $path = filter_var($_GET['file'], FILTER_SANITIZE_URL);

    if (!filter_var($path, FILTER_VALIDATE_URL)) {
        // Use the reverse proxy's domain to construct the base URL
        $baseUrl = getBaseUrl((isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]/");
        $url = $baseUrl . ltrim($path, '/');
    } else {
        $url = $path;
    }

    list($response, $contentType) = fetchFile($url);

    if ($response === false) {
        header('HTTP/1.1 500 Internal Server Error');
        die('Error fetching the file. Check error logs for details.');
    }

    header('Access-Control-Allow-Origin: *');
    header('Content-Type: ' . $contentType);

    if (strpos($contentType, 'application/vnd.apple.mpegurl') !== false || strpos($contentType, 'application/x-mpegURL') !== false) {
        $baseUrl = getBaseUrl($url);
        $response = modifyPlaylist($response, $baseUrl);
    }

    echo $response;
} else {
    header('HTTP/1.1 400 Bad Request');
    echo 'Missing file parameter.';
}
?>
