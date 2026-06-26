const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = process.env.FRONTEND_HOST || "0.0.0.0";
const PORT = Number(process.env.FRONTEND_PORT || 5500);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
};

function resolveRequestPath(url) {
    const requestUrl = new URL(url, `http://${HOST}:${PORT}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
    const filePath = path.normalize(path.join(ROOT_DIR, relativePath));

    if (!filePath.startsWith(ROOT_DIR)) {
        return null;
    }

    return filePath;
}

const server = http.createServer((req, res) => {
    const filePath = resolveRequestPath(req.url);

    if (!filePath) {
        res.writeHead(403);
        res.end("Acesso negado.");
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Arquivo nao encontrado.");
            return;
        }

        const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Frontend HitchParty em http://localhost:${PORT}`);
    console.log(`Escutando em ${HOST}:${PORT}`);
    console.log("Para testar pela rede, abra http://IP_DA_MAQUINA:" + PORT);
});
