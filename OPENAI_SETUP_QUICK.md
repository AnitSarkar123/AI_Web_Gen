# OpenAI Setup - Quick Reference

## Environment Variables Required

Add these to your `.env` file:

```env
# === REQUIRED ===
OPENAI_API_KEY="sk-proj-your-actual-key-here"
OPENAI_MODEL_NAME="gpt-4o"
OPENAI_API_ENDPOINT="https://api.openai.com/v1"
```

## Configuration Details

| Variable | Required | Default | Example |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | ✅ Yes | None | `sk-proj-...` |
| `OPENAI_MODEL_NAME` | ❌ No | `gpt-4o` | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| `OPENAI_API_ENDPOINT` | ❌ No | `https://api.openai.com/v1` | OpenAI, Azure, OpenRouter, etc. |

## Getting Your API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-`)
4. Add to `.env`: `OPENAI_API_KEY="sk-proj-xyz..."`
5. Add payment method in Billing

## Recommended Models

| Model | Cost | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| `gpt-4o` | $ | Medium | Excellent | ⭐ **Recommended** |
| `gpt-4-turbo` | $$ | Medium | Excellent | Complex reasoning |
| `gpt-3.5-turbo` | $ | Fast | Good | Quick testing |

## Where It's Used

### 1. Code Generation (codeAgent)
- **File**: `inngest/functions.ts` - line ~150
- **Model**: Uses `OPENAI_MODEL_NAME`
- **Purpose**: Generate production-quality Next.js code

### 2. Project Naming (metadataAgent)
- **File**: `inngest/functions.ts` - line ~130
- **Model**: Uses `OPENAI_MODEL_NAME`
- **Purpose**: Generate descriptive project names

## Alternative Providers (OpenAI Compatible)

### Azure OpenAI
```env
OPENAI_API_KEY="your-azure-key"
OPENAI_MODEL_NAME="gpt-4"
OPENAI_API_ENDPOINT="https://your-resource.openai.azure.com/v1"
```

### OpenRouter
```env
OPENAI_API_KEY="sk-or-your-key"
OPENAI_MODEL_NAME="openai/gpt-4o"
OPENAI_API_ENDPOINT="https://openrouter.ai/api/v1"
```

### Groq (Fastest)
```env
OPENAI_API_KEY="gsk-your-key"
OPENAI_MODEL_NAME="mixtral-8x7b-32768"
OPENAI_API_ENDPOINT="https://api.groq.com/openai/v1"
```

## Testing

```bash
# 1. Add API key to .env
# 2. Restart dev server
npm run dev

# 3. Send message from AI chatbox
# 4. Check console for logs:
[projects POST] Creating project with message: ...
[projects POST] Project created: <uuid>

# 5. Monitor for API errors - system auto-retries
[codeAgentFunction] API error, retrying in 1000ms (attempt 1/3)
```

## Pricing

- **GPT-4o**: ~$0.03/1K input, ~$0.06/1K output
- **GPT-3.5-turbo**: ~$0.0005/1K input, ~$0.0015/1K output
- **Typical code generation**: $0.50-$2.00 per request

## Troubleshooting

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check API key is correct and not expired |
| `429 Too Many Requests` | Wait - system auto-retries with backoff |
| `503 Service Unavailable` | Provider is down - system auto-retries |
| `Invalid endpoint` | Verify `OPENAI_API_ENDPOINT` format |
| `Model not found` | Check `OPENAI_MODEL_NAME` is available |

## Automatic Retry Logic

System handles failures gracefully:
- **Retry count**: 3 attempts max
- **Backoff**: Exponential (1s, 2s, 4s)
- **Errors handled**: 503, 429, and other transient errors
- **Logging**: All errors logged with `[codeAgentFunction]` prefix

## Files Modified

✅ **inngest/functions.ts**
- Changed from Gemini to OpenAI
- Using `openai()` from `@inngest/agent-kit`
- Supports `OPENAI_API_KEY`, `OPENAI_MODEL_NAME`, `OPENAI_API_ENDPOINT`

✅ **.env.example**
- Updated with OpenAI variables
- Cleaned up unused variables

✅ **OPENAI_SETUP.md**
- Full setup guide with all options
- Multiple provider examples

## Next Steps

1. **Get API key**: https://platform.openai.com/api-keys
2. **Update .env**: Add the three required variables
3. **Restart**: `npm run dev`
4. **Test**: Send a message from the chatbox
5. **Monitor**: Check console logs for activity
