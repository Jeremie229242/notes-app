import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { servicesConfig } from "../config/services";

const router = Router();

function createServiceProxy(
  targetUrl: string,
  pathRewrite?: Record<string, string>
): any {
  const options = {
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: pathRewrite || {},
    timeout: 30000, // 30 seconds
    proxyTimeout: 30000, // 30 seconds
    onError: (err: any, req: any, res: any) => {
      console.error(`Proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: "Service indisponible. Veuillez réessayer plus tard..",
          message: "Service indisponible. Veuillez réessayer plus tard..",
        });
      }
    },
    onProxyReq: (proxyReq: any, req: any) => {
      // Journaliser les détails de la requête proxy
      console.log(
        `Proxying request: ${req.method} ${req.originalUrl} to ${targetUrl}`
      );

      // Transmettre les informations utilisateur si disponibles
      if (req.user) {
        proxyReq.setHeader("x-user-id", req.user.userId);
        proxyReq.setHeader("x-user-email", req.user.email);
      }

      // Assurez-vous que le type de contenu des requêtes POST/PUT est correct.
      if (
        req.body &&
        (req.method === "POST" ||
          req.method === "PUT" ||
          req.method === "PATCH")
      ) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes: any, req: any) => {
      // Détails de la réponse du proxy de journalisation
      console.log(
        `Received response from ${targetUrl}: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`
      );
    },
  };

  return createProxyMiddleware(options);
}

router.use(
  "/api/auth",
  createServiceProxy(servicesConfig.auth.url, {
    "^/api/auth": "/auth", // Réécrire le chemin pour qu'il corresponde au point de terminaison du service
  })
);

router.use(
  "/api/users",
  createServiceProxy(servicesConfig.users.url, {
    "^/api/users": "/users", // Réécrire le chemin pour qu'il corresponde au point de terminaison du service
  })
);

router.use(
  "/api/notes",
  createServiceProxy(servicesConfig.notes.url, {
    "^/api/notes": "/notes", // Réécrire le chemin pour qu'il corresponde au point de terminaison du service
  })
);

router.use(
  "/api/tags",
  createServiceProxy(servicesConfig.tags.url, {
    "^/api/tags": "/tags", // Réécrire le chemin pour qu'il corresponde au point de terminaison du service
  })
);

export default router;