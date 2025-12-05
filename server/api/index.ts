import app from "../index";

export default async function handler(req: any, res: any) {
  try {
    if (req?.url && typeof req.url === "string") {
      req.url = req.url.replace(/^\/api(\b|\/)/, "/");
    }
    return (app as any)(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.end(e && typeof (e as any).message === "string" ? (e as any).message : "internal error");
  }
}
