import runAgent from "@/services/agent";

export async function POST(req) {
  const { input } = await req.json();
  const response = await runAgent(input);
  return Response.json({ data: response.finalOutput });
}
