import { zodResponseFormat } from "openai/helpers/zod";
import { DESIGN_PROMPT } from "@/inngest/prompt";
import OpenAI from "openai";
import { z } from "zod";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const openai = new OpenAI(
  {
  // Gemini OpenAI-compatible API base URL
  baseURL: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: geminiApiKey,
}
);

const DesignSpecSchema = z.object({
  meta: z.object({
    title: z.string(),
    mode: z.enum(["match_layout", "modernize"]),
    uncertainties: z.array(z.string()),
  }),
  theme: z.object({
    primaryColorHex: z.string().nullable(),
    backgroundColorHex: z.string().nullable(),
    textColorHex: z.string().nullable(),
    radius: z.enum(["sm", "md", "lg", "xl"]),
    fontStyle: z.enum(["modern_sans", "classic_sans", "serif"]).nullable(),
  }),
  pages: z.array(
    z.object({
      route: z.string(),
      sections: z.array(
        z.object({
          type: z.string(),
          layout: z.object({
            container: z.enum(["sm", "md", "lg"]),
            columns: z.number().int().min(1).max(6),
            align: z.enum(["left", "center"]),
          }),
          content: z.object({
            heading: z.string().nullable(),
            subheading: z.string().nullable(),
            body: z.string().nullable(),
            buttons: z.array(
              z.object({
                label: z.string(),
                variant: z.enum(["default", "outline", "secondary"]),
              })
            ),
            items: z.array(
              z.object({
                title: z.string().nullable(),
                description: z.string().nullable(),
              })
            ),
          }),
          media: z.array(
            z.object({
              kind: z.literal("image_placeholder"),
              aspect: z.enum(["square", "video", "wide"]),
              alt: z.string().nullable(),
            })
          ),
        })
      ),
    })
  ),
});

const GeminiDesignSpecSchema = z.object({
  meta: z.object({
    title: z.string(),
    mode: z.enum(["match_layout", "modernize"]),
    uncertainties: z.array(z.string()),
  }),
  theme: z.object({
    primaryColorHex: z.string().nullable(),
    backgroundColorHex: z.string().nullable(),
    textColorHex: z.string().nullable(),
    radius: z.enum(["sm", "md", "lg", "xl"]),
    fontStyle: z.enum(["modern_sans", "classic_sans", "serif"]).nullable(),
  }),
  pages: z.array(
    z.object({
      route: z.string(),
      sections: z.array(
        z.object({
          type: z.string(),
          layout: z.object({
            container: z.enum(["sm", "md", "lg"]),
            columns: z.number().int().min(1).max(6),
            align: z.enum(["left", "center"]),
          }),
          content: z.object({
            heading: z.string().nullable(),
            subheading: z.string().nullable(),
            body: z.string().nullable(),
            buttons: z.array(
              z.object({
                label: z.string(),
                variant: z.enum(["default", "outline", "secondary"]),
              })
            ),
            items: z.array(
              z.object({
                title: z.string().nullable(),
                description: z.string().nullable(),
              })
            ),
          }),
          media: z.array(
            z.object({
              kind: z.string(),
              aspect: z.enum(["square", "video", "wide"]),
              alt: z.string().nullable(),
            })
          ),
        })
      ),
    })
  ),
});

function normalizeMediaKind(): "image_placeholder" {
  return "image_placeholder";
}

export async function extractDesignSpecFromImage(params: {
  imageUrl: string;
  userHint: string | null;
}) {
  const response = await openai.chat.completions.parse({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content: DESIGN_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Return JSON that matches the required schema. User hint: ${
              params.userHint ?? ""
            }`,
          },
          {
            type: "image_url",
            image_url: {
              url: params.imageUrl,
            },
          },
        ],
      },
    ],

    response_format: zodResponseFormat(GeminiDesignSpecSchema, "design_spec"),
    temperature: 0.1,
  });

  const result = response.choices[0].message.parsed;

  if (!result) {
    throw new Error("Failed to parse the design specification");
  }
  const normalized = {
    ...result,
    pages: result.pages.map((page) => ({
      ...page,
      sections: page.sections.map((section) => ({
        ...section,
        media: section.media.map((item) => ({
          ...item,
          kind: normalizeMediaKind(),
        })),
      })),
    })),
  };

  const strictResult = DesignSpecSchema.parse(normalized);

  console.log(strictResult);

  return strictResult;
}
console.log("Design spec extraction complete");

