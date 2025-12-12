import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(
  "/proxy/rainviewer",
  createProxyMiddleware({
    target: "https://tilecache.rainviewer.com",
    changeOrigin: true,
    secure: true,
    pathRewrite: { "^/proxy/rainviewer": "" },
    onProxyRes(proxyRes) {
      proxyRes.headers["Access-Control-Allow-Origin"] = "*";
      proxyRes.headers["Access-Control-Allow-Headers"] = "*";
      proxyRes.headers["Content-Type"] = "image/png";
    },
    onError(err, req, res) {
      console.error("RainViewer Proxy Error:", err);
      res.status(500).send("Proxy error");
    }
  })
);

app.listen(4000, () => {
  console.log("RainViewer proxy running at http://localhost:4000");
});
