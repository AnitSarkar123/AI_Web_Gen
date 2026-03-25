type FeatureKey = "screenshort_upload" | "inline_code_edits";

export const requirePro = async (
  auth: () => { has: (p: { feature: FeatureKey }) => boolean },
  status: (code: number, body: unknown) => unknown,
  feature: FeatureKey,
) => {
  const { has } = auth();

  if (!has({ feature })) return status(403, { error: "Pro is required" });
};