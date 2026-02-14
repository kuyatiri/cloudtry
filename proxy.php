<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Function to fetch and return the content of a given URL, handling redirects
function fetch_content($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
    curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
    curl_setopt($ch, CURLOPT_FORBID_REUSE, true);
    
    $content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($http_code !== 200) {
        error_log("Failed to fetch URL: $url. HTTP Code: $http_code");
        return [false, $final_url];
    }
    
    if ($error) {
        error_log("cURL error: $error");
    }
    
    return [$content, $final_url];
}

// Function to modify segment URLs in the M3U8 content
function modify_m3u8_content($base_url, $m3u8_content) {
    return preg_replace_callback('/(\/?[^\/\s]+?\.(?:ts|m3u8|mp4|aac|m4s|webvtt|vtt)[a-zA-Z0-9-_\.]*)/',
        function ($matches) use ($base_url) {
            return $base_url . ltrim($matches[1], '/');
        },
        $m3u8_content
    );
}

// Function to parse and extract URIs from the playlist content
function parse_playlist($playlist_content) {
    $lines = explode("\n", $playlist_content);
    $uris = [];

    foreach ($lines as $line) {
        if (empty($line) || $line[0] === '#') {
            continue;
        }
        $uris[] = trim($line);
    }

    return $uris;
}

// Function to ensure URL is properly formatted
function build_base_url($url) {
    $parsedUrl = parse_url($url);
    $base_url = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

    if (isset($parsedUrl['path']) && $parsedUrl['path'] !== '/') {
        $base_url .= dirname($parsedUrl['path']);
        if (substr($base_url, -1) !== '/') {
            $base_url .= '/';
        }
    }

    return $base_url;
}

// Validate and sanitize URL parameter
$playlist_url = filter_var($_GET['url'] ?? '', FILTER_VALIDATE_URL);

if (empty($playlist_url)) {
    header("HTTP/1.1 400 Bad Request");
    echo "Invalid or missing URL parameter.";
    exit;
}

// Fetch the master playlist content and get the final URL after redirects
list($master_playlist_content, $final_url) = fetch_content($playlist_url);

if ($master_playlist_content === false) {
    header("HTTP/1.1 500 Internal Server Error");
    echo "Error fetching the master playlist.";
    exit;
}

// Rebuild the base URL from its components
$base_url = build_base_url($final_url);

// Modify the master playlist content to rewrite segment URLs
$modified_master_playlist_content = modify_m3u8_content($base_url, $master_playlist_content);

// Parse the master playlist to get variant playlist URIs
$variant_playlists = parse_playlist($modified_master_playlist_content);

// Initialize processed content with the modified master playlist content
$processed_content = $modified_master_playlist_content;
foreach ($variant_playlists as $playlist_uri) {
    if (preg_match('/\.m3u8$/i', $playlist_uri)) {
        $full_playlist_url = $base_url . $playlist_uri;
        list($variant_playlist_content, $variant_final_url) = fetch_content($full_playlist_url);

        if ($variant_playlist_content !== false) {
            $variant_base_url = build_base_url($variant_final_url);
            $modified_variant_playlist_content = modify_m3u8_content($variant_base_url, $variant_playlist_content);
            $processed_content = str_replace($playlist_uri, $modified_variant_playlist_content, $processed_content);
        } else {
            error_log("Failed to fetch variant playlist: $playlist_uri");
        }
    }
}

// Serve the final modified M3U8 file
header('Content-Type: application/vnd.apple.mpegurl');
echo $processed_content;
?>
